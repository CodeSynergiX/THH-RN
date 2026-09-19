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
        const result = await applicationService.trackApplication(query);
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
    [caseNoQuery],
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
  };
}
