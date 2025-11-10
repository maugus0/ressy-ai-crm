export interface Restaurant {
  restaurantId: string;
  name: string;
  type?: string;
  location?: string;
}

export interface Call {
  callId: string;
  timestamp: string; // ISO datetime
  caller: string;
  intent: string;
  outcome: string;
  duration: number; // seconds
  lang: string;
  agent: string;
  transcript?: string;
  sentiment?: "positive" | "neutral" | "negative";
  topics?: string[];
}

export interface Analytics {
  totalCalls: number;
  bookings: number;
  answerRate: number;
  avgDuration: number;
  volumeData: { day: string; calls: number; bookings: number }[];
  outcomeData: { intent: string; value: number }[];
  intentData: { name: string; value: number; color: string }[];
}
