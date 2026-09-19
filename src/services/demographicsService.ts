import { defaultApiClient } from './apiClient';
import { Category } from '../models/category.model';
import { District } from '../models/demographics.model';

export class DemographicsService {
  async getCategories(): Promise<Category[]> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: Category[];
      }>('/categories');
      return res.data || [];
    } catch {
      return [];
    }
  }

  async getDistricts(): Promise<District[]> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: District[];
      }>('/districts');
      return res.data || [];
    } catch {
      return [];
    }
  }
}

export const demographicsService = new DemographicsService();
