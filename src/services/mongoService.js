/**
 * MongoDB Service for Client-Side
 * Provides methods to interact with MongoDB via REST API
 */

const API_BASE = 'http://localhost:5000/api/mongodb';

export const mongoService = {
  async getAll(collection, filters = {}) {
    try {
      const query = new URLSearchParams();
      if (Object.keys(filters).length > 0) {
        query.append('filter', JSON.stringify(filters));
      }
      const response = await fetch(`${API_BASE}/${collection}?${query}`);
      return await response.json();
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async getById(collection, id) {
    try {
      const response = await fetch(`${API_BASE}/${collection}/${id}`);
      return await response.json();
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async create(collection, document) {
    try {
      const response = await fetch(`${API_BASE}/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(document)
      });
      return await response.json();
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async update(collection, id, updates) {
    try {
      const response = await fetch(`${API_BASE}/${collection}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return await response.json();
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async delete(collection, id) {
    try {
      const response = await fetch(`${API_BASE}/${collection}/${id}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      return { data: null, error: error.message };
    }
  }
};

export default mongoService;
