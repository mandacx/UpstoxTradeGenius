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
  private clientId = process.env.UPSTOX_CLIENT_ID || "";
  private clientSecret = process.env.UPSTOX_CLIENT_SECRET || "";
  private redirectUri = process.env.UPSTOX_REDIRECT_URI || "http://localhost:5000/api/upstox/callback";
  
  // Store runtime configuration
  private runtimeConfig: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  } = {};

  constructor() {
    if (!this.clientId || !this.clientSecret) {
      console.warn("UPSTOX_CLIENT_ID and UPSTOX_CLIENT_SECRET not provided. OAuth features will not work.");
    }
  }

  private getHeaders(accessToken?: string) {
    return {
      'Authorization': accessToken ? `Bearer ${accessToken}` : '',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  // Update runtime configuration
  updateConfig(config: { clientId?: string; clientSecret?: string; redirectUri?: string }) {
    this.runtimeConfig = { ...this.runtimeConfig, ...config };
  }

  // Get current configuration values (runtime overrides environment)
  private getCurrentClientId(): string {
    return this.runtimeConfig.clientId || this.clientId;
  }

  private getCurrentClientSecret(): string {
    return this.runtimeConfig.clientSecret || this.clientSecret;
  }

  private getCurrentRedirectUri(): string {
    return this.runtimeConfig.redirectUri || this.redirectUri;
  }

  // Generate OAuth URL for user authentication
  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.getCurrentClientId(),
      redirect_uri: this.getCurrentRedirectUri(),
      ...(state && { state }),
    });
    
    return `https://api.upstox.com/v2/login/authorization/dialog?${params}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(authorizationCode: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
  }> {
    const response = await axios.post(`${this.baseUrl}/login/authorization/token`, 
      new URLSearchParams({
        code: authorizationCode,
        client_id: this.getCurrentClientId(),
        client_secret: this.getCurrentClientSecret(),
        redirect_uri: this.getCurrentRedirectUri(),
        grant_type: "authorization_code",
      }), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    return response.data;
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
  }> {
    const response = await axios.post(`${this.baseUrl}/login/authorization/token`,
      new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.getCurrentClientId(),
        client_secret: this.getCurrentClientSecret(),
        grant_type: "refresh_token",
      }), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    return response.data;
  }

  // Get user profile
  async getUserProfile(accessToken: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/user/profile`, {
      headers: this.getHeaders(accessToken)
    });
    return response.data;
  }

  async getQuote(symbol: string, accessToken: string): Promise<UpstoxQuote> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/market-quote/quotes?symbol=${symbol}`,
        { headers: this.getHeaders(accessToken) }
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
    accessToken: string,
    resolution: string = "1minute"
  ): Promise<HistoricalDataPoint[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/historical-candle/${symbol}/${resolution}/${to}/${from}`,
        { headers: this.getHeaders(accessToken) }
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

  async getPortfolio(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/portfolio/long-term-holdings`,
        { headers: this.getHeaders(accessToken) }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      throw new Error("Failed to fetch portfolio");
    }
  }

  async getPositions(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/portfolio/short-term-positions`,
        { headers: this.getHeaders(accessToken) }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching positions:", error);
      throw new Error("Failed to fetch positions");
    }
  }

  async getFunds(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/get-funds-and-margin`,
        { headers: this.getHeaders(accessToken) }
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
  }, accessToken: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/order/place`,
        orderData,
        { headers: this.getHeaders(accessToken) }
      );
      return response.data;
    } catch (error) {
      console.error("Error placing order:", error);
      throw new Error("Failed to place order");
    }
  }

  async getOrders(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/order/retrieve-all`,
        { headers: this.getHeaders(accessToken) }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw new Error("Failed to fetch orders");
    }
  }

  async getTrades(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/order/trades/get-trade-book`,
        { headers: this.getHeaders(accessToken) }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching trades:", error);
      throw new Error("Failed to fetch trades");
    }
  }
}

export const upstoxService = new UpstoxService();
