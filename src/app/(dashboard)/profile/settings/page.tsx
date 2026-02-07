"use client";

import { useState, useEffect } from 'react';
import { Type, Calendar as CalendarIcon, Palette, Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsPage() {
  const { t, language, setLanguage, isClient } = useTranslation();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [dateFormat, setDateFormat] = useState<'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd'>('dd/mm/yyyy');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setFontSize(settings.fontSize || 'medium');
      setDateFormat(settings.dateFormat || 'dd/mm/yyyy');
      setTheme(settings.theme || 'light');
    }
  };

  const saveSettings = () => {
    const settings = { fontSize, dateFormat, theme };
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Apply font size
    document.documentElement.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('configuration')}</h1>

      <div className="space-y-6">
        {/* Font Size */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-[#FF8C00]" />
            {t('fontSize')}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'small', labelKey: 'small', sizeClass: 'text-sm' },
              { value: 'medium', labelKey: 'medium', sizeClass: 'text-base' },
              { value: 'large', labelKey: 'large', sizeClass: 'text-lg' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFontSize(option.value as any)}
                className={`p-4 rounded-lg border-2 transition ${
                  fontSize === option.value
                    ? 'border-[#FF8C00] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`font-semibold ${option.sizeClass}`}>
                  {t(option.labelKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Format */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            {t('dateFormat')}
          </h2>
          <div className="space-y-2">
            {[
              { value: 'dd/mm/yyyy', labelKey: 'dayMonthYear', example: '07/02/2026' },
              { value: 'mm/dd/yyyy', labelKey: 'monthDayYear', example: '02/07/2026' },
              { value: 'yyyy-mm-dd', labelKey: 'yearMonthDay', example: '2026-02-07' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateFormat(option.value as any)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  dateFormat === option.value
                    ? 'border-[#FF8C00] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{t(option.labelKey)}</div>
                <div className="text-sm text-gray-500 mt-1">{t('exampleDate')} {option.example}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            {t('theme')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-6 rounded-lg border-2 transition ${
                theme === 'light'
                  ? 'border-[#FF8C00] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-full h-24 bg-white rounded border-2 border-gray-300 mb-3"></div>
              <span className="font-semibold">{t('light')}</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-6 rounded-lg border-2 transition ${
                theme === 'dark'
                  ? 'border-[#FF8C00] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-full h-24 bg-gray-900 rounded border-2 border-gray-600 mb-3"></div>
              <span className="font-semibold">{t('dark')}</span>
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            {t('language')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLanguage('es')}
              className={`p-4 rounded-lg border-2 transition ${
                language === 'es'
                  ? 'border-[#FF8C00] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🇪🇸</div>
              <div className="font-semibold">{t('spanish')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('spanish_note')}</div>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-lg border-2 transition ${
                language === 'en'
                  ? 'border-[#FF8C00] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🇺🇸</div>
              <div className="font-semibold">{t('english')}</div>
              <div className="text-xs text-gray-500 mt-1">{t('english_note')}</div>
            </button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t('info')}:</strong> {t('lanugageNote')}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={saveSettings}
            className="flex-1 bg-[#FF8C00] text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition"
          >
            {t('saveSettings')}
          </button>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 text-center font-semibold">
            {t('settingsSaved')}
          </div>
        )}
      </div>
    </div>
  );
}
