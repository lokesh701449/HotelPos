import axios from "axios";

const API_URL = "http://127.0.0.1:5001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token & Property ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach propertyId dynamically to queries if it exists
    const propertyId = localStorage.getItem("propertyId");
    if (propertyId) {
      if (!config.params) {
        config.params = {};
      }
      if (!config.params.propertyId) {
        config.params.propertyId = propertyId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect to login if we are not already on it
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      if (response.data.assignedProperties && response.data.assignedProperties.length > 0) {
        localStorage.setItem("propertyId", response.data.assignedProperties[0]._id || response.data.assignedProperties[0]);
      }
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("propertyId");
    window.location.href = "/login";
  },
};

export const userAPI = {
  list: async () => {
    const response = await api.get("/users");
    return response.data;
  },
  create: async (userData) => {
    const response = await api.post("/users", userData);
    return response.data;
  },
  update: async (id, userData) => {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const propertyAPI = {
  list: async () => {
    const response = await api.get("/properties");
    return response.data;
  },
  create: async (propertyData) => {
    const response = await api.post("/properties", propertyData);
    return response.data;
  },
  update: async (id, propertyData) => {
    const response = await api.patch(`/properties/${id}`, propertyData);
    return response.data;
  },
};

export const ingredientAPI = {
  list: async () => {
    const response = await api.get("/ingredients");
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/ingredients/${id}`);
    return response.data;
  },
  create: async (ingredientData) => {
    const response = await api.post("/ingredients", ingredientData);
    return response.data;
  },
  update: async (id, ingredientData) => {
    const response = await api.patch(`/ingredients/${id}`, ingredientData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/ingredients/${id}`);
    return response.data;
  },
};

export const inventoryAPI = {
  list: async () => {
    const response = await api.get("/inventory");
    return response.data;
  },
  get: async (ingredientId) => {
    const response = await api.get(`/inventory/${ingredientId}`);
    return response.data;
  },
  lowStock: async () => {
    const response = await api.get("/inventory/low-stock");
    return response.data;
  },
  chainSummary: async () => {
    const response = await api.get("/inventory/chain-summary");
    return response.data;
  },
};

export const transactionAPI = {
  list: async (filters = {}) => {
    const response = await api.get("/transactions", { params: filters });
    return response.data;
  },
  receive: async (data) => {
    const response = await api.post("/transactions/receive", data);
    return response.data;
  },
  issue: async (data) => {
    const response = await api.post("/transactions/issue", data);
    return response.data;
  },
  consume: async (data) => {
    const response = await api.post("/transactions/consume", data);
    return response.data;
  },
  waste: async (data) => {
    const response = await api.post("/transactions/waste", data);
    return response.data;
  },
  spoilage: async (data) => {
    const response = await api.post("/transactions/spoilage", data);
    return response.data;
  },
  adjust: async (data) => {
    const response = await api.post("/transactions/adjust", data);
    return response.data;
  },
};

export const recipeAPI = {
  list: async () => {
    const response = await api.get("/recipes");
    return response.data;
  },
  create: async (recipeData) => {
    const response = await api.post("/recipes", recipeData);
    return response.data;
  },
  update: async (id, recipeData) => {
    const response = await api.patch(`/recipes/${id}`, recipeData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/recipes/${id}`);
    return response.data;
  },
  prepare: async (id, portions) => {
    const response = await api.post(`/recipes/${id}/prepare`, { portions });
    return response.data;
  },
};

export const purchaseRequestAPI = {
  list: async () => {
    const response = await api.get("/purchase-requests");
    return response.data;
  },
  create: async (requestData) => {
    const response = await api.post("/purchase-requests", requestData);
    return response.data;
  },
  approve: async (id) => {
    const response = await api.patch(`/purchase-requests/${id}/approve`);
    return response.data;
  },
  reject: async (id, reason = "") => {
    const response = await api.patch(`/purchase-requests/${id}/reject`, { notes: reason });
    return response.data;
  },
  adjust: async (id, adjustmentData) => {
    const response = await api.patch(`/purchase-requests/${id}/adjust`, adjustmentData);
    return response.data;
  },
};

export const purchaseOrderAPI = {
  list: async () => {
    const response = await api.get("/purchase-orders");
    return response.data;
  },
  create: async (orderData) => {
    const response = await api.post("/purchase-orders", orderData);
    return response.data;
  },
  generateConsolidated: async (requestIds) => {
    const response = await api.post("/purchase-orders/generate-consolidated", { requestIds });
    return response.data;
  },
};

export const dashboardAPI = {
  storeKeeper: async () => {
    const response = await api.get("/dashboard/store-keeper");
    return response.data;
  },
  chef: async () => {
    const response = await api.get("/dashboard/chef");
    return response.data;
  },
  manager: async () => {
    const response = await api.get("/dashboard/manager");
    return response.data;
  },
  purchaseManager: async () => {
    const response = await api.get("/dashboard/purchase-manager");
    return response.data;
  },
  admin: async () => {
    const response = await api.get("/dashboard/admin");
    return response.data;
  },
};

export const reportAPI = {
  foodCost: async (days) => {
    const response = await api.get("/reports/food-cost", { params: { days } });
    return response.data;
  },
  variance: async (days) => {
    const response = await api.get("/reports/variance", { params: { days } });
    return response.data;
  },
  wastage: async (days) => {
    const response = await api.get("/reports/wastage", { params: { days } });
    return response.data;
  },
  monthEndReconciliation: async () => {
    const response = await api.get("/reports/month-end-reconciliation");
    return response.data;
  },
};

export const vendorAPI = {
  list: async () => {
    const response = await api.get("/vendors");
    return response.data;
  },
  create: async (vendorData) => {
    const response = await api.post("/vendors", vendorData);
    return response.data;
  },
};

export default api;
