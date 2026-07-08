'use client';

import { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGeolocation } from '@/hooks/useGeolocation';

interface LocationValidatorProps {
  parcelId: string;
  onValidated: (location: { latitude: number; longitude: number; accuracy: number }) => void;
  onCancel: () => void;
}

export function LocationValidator({ parcelId, onValidated, onCancel }: LocationValidatorProps) {
  const { location, error, loading, requestLocation } = useGeolocation();
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    distance: number;
    message: string;
  } | null>(null);

  const handleValidateLocation = async () => {
    await requestLocation();
  };

  const handleCheckDistance = async () => {
    if (!location) return;

    setValidating(true);
    try {
      const res = await fetch('/api/parcels/validate-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setValidationResult({
          valid: data.valid,
          distance: data.distance,
          message: data.message,
        });

        if (data.valid) {
          // Esperar 2 segundos antes de continuar
          setTimeout(() => {
            onValidated({
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
            });
          }, 2000);
        }
      } else {
        setValidationResult({
          valid: false,
          distance: 0,
          message: data.error || 'Error validating location',
        });
      }
    } catch {
      setValidationResult({
        valid: false,
        distance: 0,
        message: 'Error validating location',
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Validación de Ubicación
        </h2>

        {!location && !error && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Para tocar esta puerta, necesitamos verificar que estás físicamente en el lugar.
              Por favor, permite el acceso a tu ubicación.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleValidateLocation}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-2" />
                    Permitir Ubicación
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error de Ubicación</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {error}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleValidateLocation}
                disabled={loading}
                className="flex-1"
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {location && !validationResult && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Ubicación Obtenida</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                Latitud: {location.latitude.toFixed(6)}<br />
                Longitud: {location.longitude.toFixed(6)}<br />
                Precisión: ±{location.accuracy.toFixed(0)}m
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCheckDistance}
                disabled={validating}
                className="flex-1"
              >
                {validating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Validar Distancia'
                )}
              </Button>
            </div>
          </div>
        )}

        {validationResult && (
          <div className="space-y-4">
            {validationResult.valid ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">¡Ubicación Válida!</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Estás a {validationResult.distance.toFixed(0)}m de la parcela.
                  Puedes continuar con la visita.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Ubicación Inválida</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {validationResult.message}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              {!validationResult.valid && (
                <Button
                  onClick={() => {
                    setValidationResult(null);
                    handleValidateLocation();
                  }}
                  className="flex-1"
                >
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
