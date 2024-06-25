import { ServerRespond } from './DataStreamer';

export interface Row {
  price_abc: number, 
  price_def: number,
  ratio: number,
  timestamp: Date,
  upper_bound: number,
  lower_bound: number,
  trigger_alert: number | undefined,
}


export class DataManipulator {
  private static historicalData: { price_abc: number, price_def: number }[] = [];

  private static getHistoricalAverageRatio(): number {
    if (this.historicalData.length === 0) {
      return 1; // default ratio if no historical data
    }

    const totalRatio = this.historicalData.reduce((acc, data) => acc + (data.price_abc / data.price_def), 0);
    return totalRatio / this.historicalData.length;
  }

  private static addHistoricalData(priceABC: number, priceDEF: number) {
    this.historicalData.push({ price_abc: priceABC, price_def: priceDEF });
    if (this.historicalData.length > 365) {
      this.historicalData.shift();
    }
  }

  static generateRow(serverRespond: ServerRespond[]): Row {
    const priceABC = (serverRespond[0].top_ask.price + serverRespond[0].top_bid.price) / 2;
    const priceDEF = (serverRespond[1].top_ask.price + serverRespond[1].top_bid.price) / 2;
    const ratio = priceABC / priceDEF;
    this.addHistoricalData(priceABC, priceDEF);
    const historicalAverageRatio = this.getHistoricalAverageRatio();
    const upperBound = historicalAverageRatio * 1.10;
    const lowerBound = historicalAverageRatio * 0.90;
    return {
      price_abc: priceABC, 
      price_def: priceDEF,
      ratio,
      timestamp: serverRespond[0].timestamp >serverRespond[1].timestamp ? serverRespond[0].timestamp : serverRespond[1].timestamp,
      upper_bound: upperBound,
      lower_bound: lowerBound,
      trigger_alert: (ratio > upperBound || ratio < lowerBound) ? ratio : undefined,

    };
  
  }

}
