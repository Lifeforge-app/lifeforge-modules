interface IAirportNOTAMEntry {
  id: string;
  title: [string, string];
  status: string;
  distance: string;
  time: string;
  codeSummary: string;
  duration: string;
}

interface IFlightDataEntry {
  time: string;
  date: string;
  origin: {
    iata: string;
    name: string;
  };
  flightNumber: string;
  airline: string;
  status: string;
  estimatedTime?: string;
  scheduledTime?: string;
}

export type { IAirportNOTAMEntry, IFlightDataEntry };
