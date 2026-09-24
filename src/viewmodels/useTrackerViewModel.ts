import { useState, useCallback } from 'react';
import { Application } from '../models/application.model';
import { applicationService } from '../services/applicationService';

export function useTrackerViewModel() {
  const [caseNoQuery, setCaseNoQuery] = useState<string>('');
  const [trackedApplication, setTrackedApplication] =
    useState<Application | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);

  const requestOtp = useCallback(async () => {
    const query = caseNoQuery.trim();
    if (!query) {
      return;
    }
    const res = await applicationService.requestTrackOtp(query);
    setNeedsOtp(true);
    setErrorMessage(
      res.data?.debug_code
        ? `OTP sent. Demo code: ${res.data.debug_code}`
        : 'OTP sent to the application email.',
    );
  }, [caseNoQuery]);

  const searchCase = useCallback(
    async (queryOverride?: string) => {
      const query = (queryOverride || caseNoQuery).trim();
      if (!query) {
        setErrorMessage('કૃપા કરીને અરજી નંબર દાખલ કરો (Please enter Case ID)');
        return;
      }

      setIsSearching(true);
      setErrorMessage(null);
      setHasSearched(true);

      try {
        const result = await applicationService.trackApplication(
          query,
          otp || undefined,
        );
        if (result) {
          setTrackedApplication(result);
          setErrorMessage(null);
        } else {
          setTrackedApplication(null);
          setErrorMessage(
            'આ અરજી નંબર માટે કોઈ રેકોર્ડ મળ્યો નથી (No case found with this ID)',
          );
        }
      } catch (err: unknown) {
        setTrackedApplication(null);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'શોધવામાં નિષ્ફળતા (Search failed)',
        );
      } finally {
        setIsSearching(false);
      }
    },
    [caseNoQuery, otp],
  );

  const clearSearch = useCallback(() => {
    setCaseNoQuery('');
    setTrackedApplication(null);
    setHasSearched(false);
    setErrorMessage(null);
  }, []);

  return {
    caseNoQuery,
    setCaseNoQuery,
    trackedApplication,
    isSearching,
    hasSearched,
    errorMessage,
    searchCase,
    clearSearch,
    otp,
    setOtp,
    needsOtp,
    requestOtp,
  };
}
