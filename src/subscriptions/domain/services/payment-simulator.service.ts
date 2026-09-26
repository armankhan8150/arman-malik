export class PaymentSimulatorService {
  processPayment(): boolean {
    return Math.random() >= 0.2;
  }
}