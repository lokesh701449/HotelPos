const STOCKROOM_API = process.env.STOCKROOM_API || "http://127.0.0.1:5001/api";
const STOCKROOM_EMAIL = process.env.STOCKROOM_EMAIL || "admin@stockroom.com";
const STOCKROOM_PASSWORD = process.env.STOCKROOM_PASSWORD || "password123";

export class StockRoomService {
  private token: string | null = null;
  private propertyIdMap: Record<string, string> = {};

  private async getHeaders() {
    if (!this.token) {
      await this.login();
    }
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  private async login() {
    try {
      console.log(`[StockRoom] Logging in to StockRoom at ${STOCKROOM_API}/auth/login...`);
      const response = await fetch(`${STOCKROOM_API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: STOCKROOM_EMAIL,
          password: STOCKROOM_PASSWORD,
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login API failed");
      }
      this.token = data.token;
      console.log("[StockRoom] Login successful.");
    } catch (error: any) {
      console.error("[StockRoom] Login failed:", error.message);
      throw new Error("Inventory Service Login Failed");
    }
  }

  /**
   * Resolve corresponding StockRoom propertyId from HotelPOS tenantId (matching tenant to property)
   */
  public async getPropertyId(tenantId: string): Promise<string> {
    if (this.propertyIdMap[tenantId]) {
      return this.propertyIdMap[tenantId];
    }

    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${STOCKROOM_API}/properties`, { headers });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch properties");
      }

      if (!data || data.length === 0) {
        throw new Error("No properties found in StockRoom");
      }

      // Map by name matching or fall back to the first available property
      // Tenants: "Skyline Rooftop", "Atrium Cafe", "Mysore Hall"
      // StockRoom Properties: "Grand Hyatt Mumbai", "Taj Palace Delhi"
      let matchedProperty = data[0];

      if (tenantId.toLowerCase().includes("roof") || tenantId.toLowerCase().includes("skyline")) {
        // Grand Hyatt Mumbai
        matchedProperty = data.find((p: any) => p.name.includes("Hyatt") || p.name.includes("Mumbai")) || data[0];
      } else if (tenantId.toLowerCase().includes("cafe") || tenantId.toLowerCase().includes("atrium")) {
        // Taj Palace Delhi
        matchedProperty = data.find((p: any) => p.name.includes("Taj") || p.name.includes("Delhi")) || data[0];
      } else if (tenantId.toLowerCase().includes("banquet") || tenantId.toLowerCase().includes("mysore") || tenantId.toLowerCase().includes("hall")) {
        matchedProperty = data.find((p: any) => p.name.includes("Taj") || p.name.includes("Delhi")) || data[0];
      }

      const propertyId = matchedProperty._id || matchedProperty.id;
      this.propertyIdMap[tenantId] = propertyId;
      console.log(`[StockRoom] Mapped tenant ${tenantId} to property: ${matchedProperty.name} (${propertyId})`);
      return propertyId;
    } catch (error: any) {
      console.error("[StockRoom] Failed to fetch properties:", error.message);
      return "";
    }
  }

  /**
   * Fetch all recipes for a given property
   */
  public async getRecipes(propertyId: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${STOCKROOM_API}/recipes?propertyId=${propertyId}`, {
        headers,
      });
      const data = await response.json();
      if (response.status === 401) {
        this.token = null;
        return this.getRecipes(propertyId);
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to get recipes");
      }
      return data;
    } catch (error: any) {
      console.error("[StockRoom] getRecipes failed:", error.message);
      throw error;
    }
  }

  /**
   * Fetch live inventory/stock levels for a property
   */
  public async getInventory(propertyId: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${STOCKROOM_API}/inventory?propertyId=${propertyId}`, {
        headers,
      });
      const data = await response.json();
      if (response.status === 401) {
        this.token = null;
        return this.getInventory(propertyId);
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to get inventory");
      }
      return data;
    } catch (error: any) {
      console.error("[StockRoom] getInventory failed:", error.message);
      throw error;
    }
  }

  /**
   * Execute preparation / deduction of recipe ingredients from StockRoom stock ledger
   */
  public async prepareRecipe(recipeId: string, portions: number, propertyId: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${STOCKROOM_API}/recipes/${recipeId}/prepare?propertyId=${propertyId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ portions, propertyId })
      });
      const data = await response.json();
      if (response.status === 401) {
        this.token = null;
        return this.prepareRecipe(recipeId, portions, propertyId);
      }
      if (!response.ok) {
        throw data; // Throw the returned error object directly so validation metrics can be parsed
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }
}

export const stockroomService = new StockRoomService();
