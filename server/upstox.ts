import axios from "axios";

interface UpstoxQuote {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  change: number;
  change_percent: number;
  volume: number;
}

interface HistoricalDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class UpstoxService {
  private baseUrl = "https://api.upstox.com/v2";
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.UPSTOX_ACCESS_TOKEN || "";
    if (!this.accessToken) {
      console.warn("UPSTOX_ACCESS_TOKEN not provided. Market data features will not work.");
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
    };
  }

  async getQuote(symbol: string): Promise<UpstoxQuote> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/market-quote/quotes?symbol=${symbol}`,
        { headers: this.getHeaders() }
      );

      const data = response.data.data[symbol];
      return {
        symbol,
        ltp: data.ltp,
        open: data.ohlc.open,
        high: data.ohlc.high,
        low: data.ohlc.low,
        prev_close: data.ohlc.close,
        change: data.net_change,
        change_percent: data.percent_change,
        volume: data.volume,
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
  }

  async getHistoricalData(
    symbol: string,
    from: string,
    to: string,
    resolution: string = "1minute"
  ): Promise<HistoricalDataPoint[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/historical-candle/${symbol}/${resolution}/${to}/${from}`,
        { headers: this.getHeaders() }
      );

      return response.data.data.candles.map((candle: any[]) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      }));
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
  }

  async getPortfolio(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/portfolio/long-term-holdings`,
        { headers: this.getHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      throw new Error("Failed to fetch portfolio");
    }
  }

  async getPositions(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/portfolio/short-term-positions`,
        { headers: this.getHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching positions:", error);
      throw new Error("Failed to fetch positions");
    }
  }

  async getFunds(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/get-funds-and-margin`,
        { headers: this.getHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching funds:", error);
      throw new Error("Failed to fetch funds");
    }
  }

  async placeOrder(orderData: {
    quantity: number;
    product: string;
    validity: string;
    price: number;
    tag: string;
    instrument_token: string;
    order_type: string;
    transaction_type: string;
    disclosed_quantity: number;
    trigger_price: number;
    is_amo: boolean;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/order/place`,
        orderData,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error placing order:", error);
      throw new Error("Failed to place order");
    }
  }

  async getOrders(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/order/retrieve-all`,
        { headers: this.getHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw new Error("Failed to fetch orders");
    }
  }

  async getTrades(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/order/trades/get-trade-book`,
        { headers: this.getHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching trades:", error);
      throw new Error("Failed to fetch trades");
    }
  }
}

export const upstoxService = new UpstoxService();
