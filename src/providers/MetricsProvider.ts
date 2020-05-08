import http from "http";
import prometheus, { register } from "prom-client";
import { AddressInfo } from "net";
import PurrplingBot from "@purrplingbot/core/PurrplingBot";
import { autobind } from "core-decorators";

export default class MetricsProvider {
  private readonly server: http.Server;
  
  constructor(private readonly purrplingBot: PurrplingBot) {
    this.server = http.createServer(this.handle);

  }

  @autobind
  private handle(req: http.IncomingMessage, res: http.OutgoingMessage): void {
    res.setHeader("Content-Type", register.contentType);
    res.end(register.metrics());
  }

  serve(): void {
    if (this.server.listening) {
      return;
    }

    prometheus.collectDefaultMetrics({ register });
    // register.registerMetric(this.readyAt);

    this.server.on("listening", () => {
      const address: AddressInfo = this.server.address() as AddressInfo;

      console.log(`Prometheus metrics are served on http://${address.address}:${address.port})}`)
    })
    this.server.listen(9120);
  }
}
