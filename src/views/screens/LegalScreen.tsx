import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { defaultApiClient } from '../../services/apiClient';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

export const LegalScreen: React.FC<{
  slug: string;
  onBack: () => void;
}> = ({ slug, onBack }) => {
  const { theme } = useAppTheme();
  const { locale, t } = useTranslation();
  const { colors, typography } = theme;
  const { width } = useWindowDimensions();
  const [title, setTitle] = useState(slug);
  const [body, setBody] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await defaultApiClient.get<{
          data?: { title: string; body: string };
          title?: string;
          body?: string;
        }>(`/config/pages/${slug}?locale=${locale}`);
        const pageData = res.data ?? res;
        setTitle(pageData.title ?? slug);
        setBody((pageData.body ?? '').replace(/<[^>]+>/g, '\n').trim());
      } catch {
        setBody(
          t(
            'legal.unpublished',
            'This page will appear once the admin publishes it.',
          ),
        );
      }
    })();
  }, [slug, locale, t]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <TouchableOpacity onPress={onBack}>
        <Text
          style={{ color: colors.primary, fontSize: typography.fontSizeBase }}
        >
          {t('common.back', 'Back')}
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          color: colors.text,
          fontSize: typography.fontSizeXl,
          fontWeight: '700',
          marginVertical: 16,
        }}
      >
        {title}
      </Text>
      <ScrollView style={{ width }}>
        <Text style={{ color: colors.text, fontSize: 18, lineHeight: 26 }}>
          {body}
        </Text>
      </ScrollView>
    </View>
  );
};
