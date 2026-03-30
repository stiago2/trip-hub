import axios from 'axios';
import { Injectable } from '@nestjs/common';

const HOST = 'booking-com15.p.rapidapi.com';
const BASE = `https://${HOST}/api/v1`;

@Injectable()
export class FlightSearchService {
  private get headers() {
    return {
      'x-rapidapi-key': process.env['RAPIDAPI_KEY'] ?? '',
      'x-rapidapi-host': HOST,
    };
  }

  async searchLocations(query: string) {
    const { data } = await axios.get(`${BASE}/flights/searchDestination`, {
      params: { query },
      headers: this.headers,
    });
    return (data.data ?? [])
      .filter((loc: any) => loc.type === 'AIRPORT')
      .map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        code: loc.code,
        cityName: loc.cityName ?? loc.city ?? loc.name,
        countryName: loc.countryName ?? '',
      }));
  }

  async searchFlights(params: {
    fromId: string;
    toId: string;
    departDate: string;
    adults: number;
    stops?: string;
    cabinClass?: string;
  }) {
    const { data } = await axios.get(`${BASE}/flights/searchFlights`, {
      params: {
        fromId: params.fromId,
        toId: params.toId,
        departDate: params.departDate,
        adults: params.adults,
        stops: params.stops ?? 'none',
        cabinClass: params.cabinClass ?? 'ECONOMY',
        currency_code: 'USD',
        sort: 'BEST',
      },
      headers: this.headers,
    });

    const offers = data.data?.flightOffers ?? [];
    return offers.map((offer: any) => {
      const seg = offer.segments?.[0];
      const leg = seg?.legs?.[0];
      const carrier = leg?.carriersData?.[0];
      const price = offer.priceBreakdown?.total;
      return {
        token: offer.token ?? '',
        price: price?.units ?? 0,
        currency: price?.currencyCode ?? 'USD',
        airline: carrier?.name ?? 'Unknown',
        airlineCode: carrier?.code ?? '',
        flightNumber: String(leg?.flightInfo?.flightNumber ?? ''),
        fromCode: seg?.departureAirport?.code ?? '',
        fromCity: seg?.departureAirport?.cityName ?? '',
        toCode: seg?.arrivalAirport?.code ?? '',
        toCity: seg?.arrivalAirport?.cityName ?? '',
        departureTime: seg?.departureTime ?? '',
        arrivalTime: seg?.arrivalTime ?? '',
        durationMinutes: Math.round((leg?.totalTime ?? 0) / 60),
        stops: (seg?.legs?.length ?? 1) - 1,
        cabinClass: leg?.cabinClass ?? params.cabinClass ?? 'ECONOMY',
      };
    });
  }
}
