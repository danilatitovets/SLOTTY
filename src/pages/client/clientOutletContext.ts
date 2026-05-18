export type ClientOutletContext = {
  clientShell: true;
  cityLabel: string;
  requestGeo: () => void;
  hasGeo: boolean;
  userLat: number | null;
  userLng: number | null;
};
