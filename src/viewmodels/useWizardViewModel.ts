import { useState, useEffect, useCallback } from 'react';
import {
  ApplicationUrgency,
  CreateApplicationPayload,
} from '../models/application.model';
import { Category, SubCategory } from '../models/category.model';
import { District, Taluka, Village } from '../models/demographics.model';
import { applicationService } from '../services/applicationService';
import { demographicsService } from '../services/demographicsService';
import { offlineSyncService } from '../services/offlineSyncService';

export interface WizardFormData {
  categoryId: number | null;
  subCategoryId: number | null;
  title: string;
  description: string;
  urgency: ApplicationUrgency;
  districtId: number | null;
  talukaId: number | null;
  villageId: number | null;
  lat: number | null;
  lng: number | null;
  locationAccuracy: string | null;
  isDetectingLocation: boolean;
  isHelperMode: boolean;
  beneficiaryName: string;
  beneficiaryPhone: string;
  email: string;
}

export function useWizardViewModel(initialCategory?: string | number | null) {
  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [availableTalukas, setAvailableTalukas] = useState<Taluka[]>([]);
  const [availableVillages, setAvailableVillages] = useState<Village[]>([]);
  const [availableSubCategories, setAvailableSubCategories] = useState<
    SubCategory[]
  >([]);

  const [formData, setFormData] = useState<WizardFormData>({
    categoryId: null,
    subCategoryId: null,
    title: '',
    description: '',
    urgency: 'medium',
    districtId: null,
    talukaId: null,
    villageId: null,
    lat: null,
    lng: null,
    locationAccuracy: null,
    isDetectingLocation: false,
    isHelperMode: false,
    beneficiaryName: '',
    beneficiaryPhone: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [generatedCaseNo, setGeneratedCaseNo] = useState<string | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState<boolean>(false);

  // Load master data on mount
  useEffect(() => {
    (async () => {
      try {
        const [cats, dists] = await Promise.all([
          demographicsService.getCategories(),
          demographicsService.getDistricts(),
        ]);
        setCategories(cats);
        setDistricts(dists);

        if (initialCategory !== undefined && initialCategory !== null) {
          const match = cats.find(
            c =>
              c.id === Number(initialCategory) ||
              c.slug.toLowerCase() === String(initialCategory).toLowerCase(),
          );
          if (match) {
            setFormData(prev => ({
              ...prev,
              categoryId: match.id,
              subCategoryId: match.sub_categories?.[0]?.id || null,
            }));
            setAvailableSubCategories(match.sub_categories || []);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch master data:', err);
      }
    })();
  }, [initialCategory]);

  // Update available subcategories when category changes
  const selectCategory = useCallback(
    (categoryId: number) => {
      setFormData(prev => ({ ...prev, categoryId, subCategoryId: null }));
      const cat = categories.find(c => c.id === categoryId);
      setAvailableSubCategories(cat?.sub_categories || []);
      setErrors(prev => ({ ...prev, categoryId: '' }));
    },
    [categories],
  );

  const selectSubCategory = useCallback((subCategoryId: number | null) => {
    setFormData(prev => ({ ...prev, subCategoryId }));
  }, []);

  // Update available talukas when district changes
  const selectDistrict = useCallback(
    (districtId: number | null) => {
      setFormData(prev => ({
        ...prev,
        districtId,
        talukaId: null,
        villageId: null,
      }));
      if (!districtId) {
        setAvailableTalukas([]);
        setAvailableVillages([]);
        return;
      }
      const dist = districts.find(d => d.id === districtId);
      setAvailableTalukas(dist?.talukas || []);
      setAvailableVillages([]);
      setErrors(prev => ({ ...prev, districtId: '' }));
    },
    [districts],
  );

  // Update available villages when taluka changes
  const selectTaluka = useCallback(
    (talukaId: number | null) => {
      setFormData(prev => ({ ...prev, talukaId, villageId: null }));
      if (!talukaId) {
        setAvailableVillages([]);
        return;
      }
      const taluka = availableTalukas.find(t => t.id === talukaId);
      setAvailableVillages(taluka?.villages || []);
    },
    [availableTalukas],
  );

  const selectVillage = useCallback((villageId: number | null) => {
    setFormData(prev => ({ ...prev, villageId }));
  }, []);

  const updateField = useCallback(
    <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => {
      setFormData(prev => ({ ...prev, [key]: value }));
      setErrors(prev => ({ ...prev, [key]: '' }));
    },
    [],
  );

  // Validate step before advancing
  const validateStep = useCallback(
    (currentStep: number): boolean => {
      const newErrors: Record<string, string> = {};

      if (currentStep === 1) {
        if (!formData.categoryId) {
          newErrors.categoryId =
            'કૃપા કરીને સહાયતા કેટેગરી પસંદ કરો (Please select a category)';
        }
      } else if (currentStep === 2) {
        if (!formData.title.trim()) {
          newErrors.title = 'અરજીનો વિષય જરૂરી છે (Title is required)';
        }
        if (
          !formData.description.trim() ||
          formData.description.trim().length < 10
        ) {
          newErrors.description =
            'ઓછામાં ઓછા ૧૦ અક્ષરોનું વર્ણન લખો (Please describe your requirement in at least 10 characters)';
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
          newErrors.email = 'Email is required to create or match your account';
        }
        if (formData.isHelperMode) {
          if (!formData.beneficiaryName.trim()) {
            newErrors.beneficiaryName =
              'લાભાર્થીનું નામ જરૂરી છે (Beneficiary name is required)';
          }
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData],
  );

  const nextStep = useCallback(() => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  }, [step, validateStep]);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
  }, []);

  const detectLiveLocation = useCallback(async () => {
    setFormData(prev => ({ ...prev, isDetectingLocation: true }));
    try {
      const globalNav = (
        globalThis as unknown as {
          navigator?: { geolocation?: { getCurrentPosition: Function } };
        }
      ).navigator;
      if (globalNav && globalNav.geolocation) {
        globalNav.geolocation.getCurrentPosition(
          (pos: {
            coords: { latitude: number; longitude: number; accuracy?: number };
          }) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            const acc = pos.coords.accuracy
              ? `±${Math.round(pos.coords.accuracy)}m`
              : 'GPS High Precision';
            setFormData(prev => ({
              ...prev,
              lat,
              lng,
              locationAccuracy: acc,
              isDetectingLocation: false,
            }));
          },
          (_err: unknown) => {
            // Default tribal regional GPS center (Dang Ahwa: 20.7532, 73.6841)
            setFormData(prev => ({
              ...prev,
              lat: 20.7532,
              lng: 73.6841,
              locationAccuracy: 'Tribal Regional Center (Ahwa)',
              isDetectingLocation: false,
            }));
          },
          { enableHighAccuracy: true, timeout: 8000 },
        );
      } else {
        setFormData(prev => ({
          ...prev,
          lat: 20.7532,
          lng: 73.6841,
          locationAccuracy: 'Field Device Pin (Ahwa)',
          isDetectingLocation: false,
        }));
      }
    } catch {
      setFormData(prev => ({
        ...prev,
        lat: 20.7532,
        lng: 73.6841,
        locationAccuracy: 'Field Device Pin',
        isDetectingLocation: false,
      }));
    }
  }, []);

  const clearCoordinates = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lat: null,
      lng: null,
      locationAccuracy: null,
    }));
  }, []);

  // Final submission
  const submitApplication = useCallback(async () => {
    if (!validateStep(step)) {
      return;
    }

    setIsSubmitting(true);
    setIsSavedOffline(false);

    const payload: CreateApplicationPayload = {
      category_id: formData.categoryId!,
      sub_category_id: formData.subCategoryId,
      title: formData.title,
      description: formData.description,
      urgency: formData.urgency,
      district_id: formData.districtId,
      taluka_id: formData.talukaId,
      village_id: formData.villageId,
      lat: formData.lat,
      lng: formData.lng,
      is_helper_mode: formData.isHelperMode,
      beneficiary_name: formData.beneficiaryName || null,
      beneficiary_phone: formData.beneficiaryPhone || null,
      email: formData.email || null,
      name: formData.beneficiaryName || null,
      phone: formData.beneficiaryPhone || null,
    };

    try {
      // Try direct API submission
      const created = await applicationService.createApplication(payload);
      setGeneratedCaseNo(created.case_no);
      setSubmitSuccess(true);
    } catch {
      // Offline fallback: save to offline sync queue
      await offlineSyncService.enqueue(payload);
      const tempId = `THH-OFFLINE-${Date.now().toString().slice(-5)}`;
      setGeneratedCaseNo(tempId);
      setIsSavedOffline(true);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, step, validateStep]);

  const resetWizard = useCallback(() => {
    setStep(1);
    setFormData({
      categoryId: null,
      subCategoryId: null,
      title: '',
      description: '',
      urgency: 'medium',
      districtId: null,
      talukaId: null,
      villageId: null,
      lat: null,
      lng: null,
      locationAccuracy: null,
      isDetectingLocation: false,
      isHelperMode: false,
      beneficiaryName: '',
      beneficiaryPhone: '',
      email: '',
    });
    setErrors({});
    setSubmitSuccess(false);
    setGeneratedCaseNo(null);
    setIsSavedOffline(false);
  }, []);

  return {
    step,
    categories,
    districts,
    availableTalukas,
    availableVillages,
    availableSubCategories,
    formData,
    errors,
    isSubmitting,
    submitSuccess,
    generatedCaseNo,
    isSavedOffline,
    selectCategory,
    selectSubCategory,
    selectDistrict,
    selectTaluka,
    selectVillage,
    detectLiveLocation,
    clearCoordinates,
    updateField,
    nextStep,
    prevStep,
    submitApplication,
    resetWizard,
  };
}
