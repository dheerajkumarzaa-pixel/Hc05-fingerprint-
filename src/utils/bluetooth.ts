import { BluetoothState } from '../types';

export interface BluetoothManagerCallbacks {
  onStateChange: (state: BluetoothState, deviceName?: string) => void;
  onDataReceived: (data: string) => void;
  onLog: (direction: 'TX' | 'RX' | 'SYS', message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export class HC05BluetoothManager {
  private state: BluetoothState = 'DISCONNECTED';
  private deviceName = 'HC-05';
  private callbacks: BluetoothManagerCallbacks;
  private isSimulated = true;
  private bluetoothDevice: any = null;
  private gattServer: any = null;
  private txCharacteristic: any = null;
  private serialPort: any = null;
  private serialReader: any = null;
  private serialWriter: any = null;

  constructor(callbacks: BluetoothManagerCallbacks) {
    this.callbacks = callbacks;
  }

  public getState(): BluetoothState {
    return this.state;
  }

  public getDeviceName(): string {
    return this.deviceName;
  }

  public isSimulatedMode(): boolean {
    return this.isSimulated;
  }

  /**
   * Connect via Web Bluetooth API (for HC-05 BLE / SPP bridges)
   */
  public async connectWebBluetooth(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      this.callbacks.onLog('SYS', 'Web Bluetooth API not available in this browser. You can use Simulated Link or Web Serial.', 'warning');
      return false;
    }

    try {
      this.setState('SCANNING');
      this.callbacks.onLog('SYS', 'Scanning for nearby Bluetooth devices (HC-05, SPP-CA, BT-05)...', 'info');

      // Request any bluetooth device or specifically HC-05/SPP
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard HM-10 / HC-05 BLE service
          '00001800-0000-1000-8000-00805f9b34fb',
          '00001801-0000-1000-8000-00805f9b34fb',
          '0000ffe1-0000-1000-8000-00805f9b34fb',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
        ],
      });

      this.setState('CONNECTING');
      this.callbacks.onLog('SYS', `Selected device: ${device.name || 'Unnamed BT Module'}. Connecting GATT...`, 'info');

      this.bluetoothDevice = device;
      this.deviceName = device.name || 'HC-05 Wireless';

      device.addEventListener('gattserverdisconnected', () => {
        this.callbacks.onLog('SYS', 'Bluetooth GATT connection disconnected.', 'warning');
        this.disconnect();
      });

      const server = await device.gatt.connect();
      this.gattServer = server;

      // Attempt to find UART TX/RX characteristic
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.txCharacteristic = char;
            }
            if (char.properties.notify || char.properties.indicate) {
              await char.startNotifications();
              char.addEventListener('characteristicvaluechanged', (ev: any) => {
                const value = new TextDecoder().decode(ev.target.value);
                this.callbacks.onLog('RX', value.trim(), 'info');
                this.callbacks.onDataReceived(value);
              });
            }
          }
        }
      } catch (e) {
        console.warn('Could not bind GATT characteristics', e);
      }

      this.isSimulated = false;
      this.setState('CONNECTED');
      this.callbacks.onLog('SYS', `Successfully linked with ${this.deviceName}!`, 'success');
      return true;
    } catch (err: any) {
      this.callbacks.onLog('SYS', `Bluetooth connection error: ${err.message || 'Cancelled'}`, 'error');
      this.disconnect();
      return false;
    }
  }

  /**
   * Connect via Web Serial API (useful for Arduino plugged via USB or paired HC-05 COM port)
   */
  public async connectWebSerial(baudRate = 9600): Promise<boolean> {
    if (typeof navigator === 'undefined' || !(navigator as any).serial) {
      this.callbacks.onLog('SYS', 'Web Serial API is not supported in this browser. Try Google Chrome or Edge.', 'warning');
      return false;
    }

    try {
      this.setState('SCANNING');
      this.callbacks.onLog('SYS', 'Prompting for Serial / COM port (HC-05 Paired Port or Arduino USB)...', 'info');

      const port = await (navigator as any).serial.requestPort();
      this.setState('CONNECTING');
      await port.open({ baudRate });

      this.serialPort = port;
      this.deviceName = `Serial Port (${baudRate} baud)`;
      this.isSimulated = false;

      this.startSerialReadLoop();

      this.setState('CONNECTED');
      this.callbacks.onLog('SYS', `Serial link established on ${this.deviceName}`, 'success');
      return true;
    } catch (err: any) {
      this.callbacks.onLog('SYS', `Serial connection failed: ${err.message}`, 'error');
      this.disconnect();
      return false;
    }
  }

  private async startSerialReadLoop() {
    if (!this.serialPort || !this.serialPort.readable) return;
    try {
      const textDecoder = new TextDecoderStream();
      this.serialPort.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      this.serialReader = reader;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          this.callbacks.onLog('RX', value.trim(), 'info');
          this.callbacks.onDataReceived(value);
        }
      }
    } catch (err: any) {
      console.warn('Serial read error', err);
    }
  }

  /**
   * Enable virtual hardware simulation mode (instant connection for browser testing)
   */
  public connectSimulation(name = 'Virtual HC-05 (Arduino Uno)'): void {
    this.deviceName = name;
    this.isSimulated = true;
    this.setState('CONNECTING');
    this.callbacks.onLog('SYS', `Booting simulated HC-05 UART transceiver [9600 baud, 8-N-1]...`, 'info');

    setTimeout(() => {
      this.setState('CONNECTED');
      this.callbacks.onLog('SYS', `Linked with ${this.deviceName}. Ready to send biometric commands.`, 'success');
      // Echo ready ping from Arduino
      setTimeout(() => {
        this.callbacks.onLog('RX', 'ARDUINO_READY: CASE_LOCKED [AT+STATE=PAIRED]', 'info');
        this.callbacks.onDataReceived('ARDUINO_READY');
      }, 400);
    }, 600);
  }

  public disconnect(): void {
    if (this.gattServer && this.gattServer.connected) {
      this.gattServer.disconnect();
    }
    if (this.serialReader) {
      this.serialReader.cancel().catch(() => {});
    }
    if (this.serialPort) {
      this.serialPort.close().catch(() => {});
    }

    this.gattServer = null;
    this.txCharacteristic = null;
    this.serialPort = null;
    this.serialReader = null;
    this.serialWriter = null;

    this.setState('DISCONNECTED');
    this.callbacks.onLog('SYS', 'Bluetooth / Serial interface disconnected.', 'info');
  }

  /**
   * Send command packet to Arduino via HC-05
   * Commands:
   *  - 'U' : Unlock (Fingerprint validated)
   *  - 'F' : Fail (Fingerprint mismatch)
   *  - 'X' : Lockout (3 failed attempts -> 10m lockdown)
   *  - 'L' : Lock immediately
   *  - 'P' : Ping / Status check
   */
  public async sendCommand(command: string): Promise<boolean> {
    if (this.state !== 'CONNECTED') {
      this.callbacks.onLog('SYS', `Cannot send "${command}": HC-05 not connected. Connect first.`, 'error');
      return false;
    }

    const payload = command.endsWith('\n') ? command : `${command}\n`;
    this.callbacks.onLog('TX', payload.trim(), 'info');

    if (this.isSimulated) {
      // Respond as simulated Arduino
      setTimeout(() => {
        this.handleSimulatedArduinoResponse(command.trim());
      }, 150);
      return true;
    }

    // Web Serial Write
    if (this.serialPort && this.serialPort.writable) {
      try {
        const encoder = new TextEncoder();
        const writer = this.serialPort.writable.getWriter();
        await writer.write(encoder.encode(payload));
        writer.releaseLock();
        return true;
      } catch (err: any) {
        this.callbacks.onLog('SYS', `Serial TX Error: ${err.message}`, 'error');
        return false;
      }
    }

    // Web Bluetooth GATT Write
    if (this.txCharacteristic) {
      try {
        const encoder = new TextEncoder();
        await this.txCharacteristic.writeValue(encoder.encode(payload));
        return true;
      } catch (err: any) {
        this.callbacks.onLog('SYS', `BLE TX Error: ${err.message}`, 'error');
        return false;
      }
    }

    return true;
  }

  private handleSimulatedArduinoResponse(cmd: string) {
    switch (cmd) {
      case 'U':
      case 'UNLOCK':
        this.callbacks.onLog('RX', 'ACK:UNLOCKED [BUZZER: 1_LONG_BEEP, SOLENOID: HIGH]', 'success');
        this.callbacks.onDataReceived('ACK:UNLOCKED');
        break;
      case 'F':
      case 'FAIL':
        this.callbacks.onLog('RX', 'ACK:FAIL [BUZZER: 3_SHORT_BEEPS, ATTEMPT_RECORDED]', 'warning');
        this.callbacks.onDataReceived('ACK:FAIL');
        break;
      case 'X':
      case 'LOCKOUT':
        this.callbacks.onLog('RX', 'ACK:LOCKOUT_ACTIVATED [BUZZER: 4_BEEPS, TIMER: 600s]', 'error');
        this.callbacks.onDataReceived('ACK:LOCKOUT');
        break;
      case 'L':
      case 'LOCK':
        this.callbacks.onLog('RX', 'ACK:LOCKED [SOLENOID: LOW]', 'info');
        this.callbacks.onDataReceived('ACK:LOCKED');
        break;
      case 'P':
      case 'PING':
        this.callbacks.onLog('RX', 'PONG:HC05_ONLINE [PIN8_BUZZER, PIN7_LOCK]', 'info');
        this.callbacks.onDataReceived('PONG');
        break;
      default:
        this.callbacks.onLog('RX', `ACK:${cmd}`, 'info');
        this.callbacks.onDataReceived(`ACK:${cmd}`);
        break;
    }
  }

  private setState(state: BluetoothState) {
    this.state = state;
    this.callbacks.onStateChange(state, this.deviceName);
  }
}
