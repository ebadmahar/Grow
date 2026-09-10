import React from 'react';
import { MapPin } from '../../types/models';

export interface HomeMapPreviewProps {
  mapPins?: MapPin[];
  mapPreviewHtml?: string;
}

export const HomeMapPreview: React.FC<HomeMapPreviewProps> = ({ mapPreviewHtml }) => {
  return (
    <iframe
      title="Islamabad Restoration Map Preview"
      srcDoc={mapPreviewHtml || ''}
      width="100%"
      height="100%"
      style={{ border: 0, pointerEvents: 'none' }}
    />
  );
};
