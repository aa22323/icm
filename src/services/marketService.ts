import axios from 'axios';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

import { PRODUCTS } from '../constants';

const API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  t: string;
}

export const marketService = {
  // Apply market control manipulation
  async getManipulatedPrice(symbol: string, basePrice: number) {
    try {
      // 1. Check for Daily Range Control (Priority 1)
      const rangeQ = query(
        collection(db, "market_ranges"),
        where("symbol", "==", symbol),
        where("isActive", "==", true)
      );
      const rangeSnap = await getDocs(rangeQ);
      
      let currentBase = basePrice;

      if (!rangeSnap.empty) {
        const range = rangeSnap.docs[0].data();
        const min = range.minPrice;
        const max = range.maxPrice;
        const mid = (min + max) / 2;
        const halfRange = (max - min) / 2;

        // Create a slow fluctuation using sine wave (10 minute cycle)
        // We use the current timestamp to ensure all users see the same "fluctuated" price
        const timeFactor = Date.now() / (1000 * 60 * 10); // 10 minutes per cycle
        const sinFactor = Math.sin(timeFactor * Math.PI * 2); // -1 to 1
        
        // Add some micro-noise based on seconds to make it look "live"
        const noise = (Math.sin(Date.now() / 2000) * 0.05) * (halfRange * 0.1);
        
        // Target price within the range
        const targetInRange = mid + (halfRange * sinFactor * 0.8) + noise;
        
        // We blend the real market price with our range target to keep some "market feel"
        // but ensure it stays strictly within bounds
        currentBase = Math.max(min, Math.min(max, targetInRange));
      }

      // 2. Check for Manual Intervention (Target Price) (Priority 2 - overrides range if active)
      const controlQ = query(
        collection(db, "market_controls"), 
        where("symbol", "==", symbol),
        where("isActive", "==", true)
      );
      const controlSnap = await getDocs(controlQ);
      
      if (controlSnap.empty) return currentBase;

      const control = controlSnap.docs[0].data();
      const startTime = control.startTime.toDate().getTime();
      const now = Date.now();
      const elapsedMinutes = (now - startTime) / (1000 * 60);
      
      if (elapsedMinutes > control.durationMinutes) {
        return control.targetPrice || currentBase * (1 + (control.targetChange || 0) / 100);
      }

      // Linear interpolation for "slow" movement
      const progress = elapsedMinutes / control.durationMinutes;
      
      if (control.targetPrice) {
        const startPrice = control.startPrice || currentBase;
        const priceDiff = control.targetPrice - startPrice;
        return startPrice + (priceDiff * progress);
      } else {
        const currentTargetChange = (control.targetChange || 0) * progress;
        return currentBase * (1 + currentTargetChange / 100);
      }
    } catch (err) {
      return basePrice;
    }
  },

  // Fetch real-time price for a symbol
  async getRealTimePrice(symbol: string) {
    if (!API_KEY) return null;
    try {
      const response = await axios.get(`${BASE_URL}/price`, {
        params: {
          symbol,
          apikey: API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching price:', error);
      return null;
    }
  },

  // Fetch historical candlestick data
  async getTimeSeries(symbol: string, interval: string, outputsize: number = 50) {
    if (!API_KEY) return null;
    
    // Map our timeframe labels to Twelve Data intervals
    const intervalMap: Record<string, string> = {
      '1M': '1min',
      '5M': '5min',
      '15M': '15min',
      '30M': '30min',
      '1H': '1h',
      '1D': '1day',
    };

    try {
      const response = await axios.get(`${BASE_URL}/time_series`, {
        params: {
          symbol,
          interval: intervalMap[interval] || '5min',
          outputsize,
          apikey: API_KEY,
        },
      });

      if (response.data.status === 'error') {
        throw new Error(response.data.message);
      }

      return response.data.values.map((v: any) => ({
        o: parseFloat(v.open),
        h: parseFloat(v.high),
        l: parseFloat(v.low),
        c: parseFloat(v.close),
        t: v.datetime,
      })).reverse(); // API returns newest first, we want oldest first for chart
    } catch (error) {
      console.error('Error fetching time series:', error);
      return null;
    }
  },

  // Get a deterministic daily open price for a symbol
  getDailyOpenPrice(symbol: string, basePrice: number) {
    const todayStr = new Date().toISOString().split('T')[0];
    let h = 0;
    const seed = `${todayStr}-${symbol}-daily-open`;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    const seededRand = () => {
      h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
      h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
      h = (h ^ h >>> 16) >>> 0;
      return h / 4294967296;
    };
    // Return a price within +/- 1.5% of the base price
    return basePrice * (1 + (seededRand() * 0.03 - 0.015));
  },

  calculatePnL(order: any, currentPrice: number) {
    const { type, entryPrice, lots, symbol } = order;
    const product = PRODUCTS.find(p => p.symbol === symbol);
    const contractSize = product?.contractSize || 100000;
    
    const priceDiff = type === 'buy' ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
    return priceDiff * lots * contractSize;
  }
};
