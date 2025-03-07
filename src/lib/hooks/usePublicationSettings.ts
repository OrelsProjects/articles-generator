import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSettings } from './useSettings';

export interface PublicationSettings {
  preferredTopics: string[];
  personalDescription: string;
  mainTopics: string[];
  userSettingsUpdatedAt: Date | null;
  generatedDescription: string;
  generatedTopics: string;
}

export const usePublicationSettings = () => {
  const [settings, setSettings] = useState<PublicationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasPublication } = useSettings();

  const fetchSettings = async () => {
    if (!hasPublication) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/user/publication-settings');
      setSettings(response.data.settings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch publication settings');
      console.error('Error fetching publication settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedSettings: Partial<PublicationSettings>) => {
    if (!hasPublication) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/user/publication-settings', updatedSettings);
      setSettings(prev => prev ? { ...prev, ...response.data.settings } : response.data.settings);
      toast.success('Publication settings updated successfully');
      return response.data.settings;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update publication settings';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating publication settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPublication) {
      fetchSettings();
    }
  }, [hasPublication]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    hasPublication
  };
}; 