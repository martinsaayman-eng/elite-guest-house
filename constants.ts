
import { Room } from './types';

export const GUEST_HOUSE_NAME = "ESTATE MANAGEMENT";
export const GUEST_HOUSE_ADDRESS = "123 Luxury Avenue, Cape Town, 8001";
export const GUEST_HOUSE_PHONE = "+27 21 555 1234";
export const BUSINESS_DETAILS = {
  regNumber: "2024/000000/07",
  vatNumber: "4000123456",
  bankName: "First National Bank",
  accountNumber: "62000000000",
  branchCode: "250655",
  accountType: "Current"
};
export const VAT_RATE = 0.15;
export const CHECK_IN_TIME = "14:00";
export const CHECK_OUT_TIME = "10:00";

// Mock Tenant and Property for Demo
export const DEFAULT_TENANT_ID = "tenant-001";
export const DEFAULT_PROPERTY_ID = "prop-001";

export const ROOMS: Room[] = [
  {
    id: 'room-1',
    tenant_id: DEFAULT_TENANT_ID,
    property_id: DEFAULT_PROPERTY_ID,
    name: 'Presidential Master Suite',
    pricePerNightCents: 450000,
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000',
    description: 'Our most prestigious residence, featuring a panoramic balcony and dedicated workspace.',
    features: ['King Bed', 'Private Balcony', 'Soaking Tub']
  },
  {
    id: 'room-2',
    tenant_id: DEFAULT_TENANT_ID,
    property_id: DEFAULT_PROPERTY_ID,
    name: 'Garden Terrace Loft',
    pricePerNightCents: 320000,
    imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1000',
    description: 'A serene sanctuary opening directly into our private botanical garden.',
    features: ['Queen Bed', 'Terrace Access', 'Garden Views']
  },
  {
    id: 'room-3',
    tenant_id: DEFAULT_TENANT_ID,
    property_id: DEFAULT_PROPERTY_ID,
    name: 'Metropolitan Studio',
    pricePerNightCents: 280000,
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1000',
    description: 'Contemporary design meet functional elegance for the modern traveler.',
    features: ['Queen Bed', 'Smart TV', 'Work Desk']
  },
  {
    id: 'room-4',
    tenant_id: DEFAULT_TENANT_ID,
    property_id: DEFAULT_PROPERTY_ID,
    name: 'Azure Bay Suite',
    pricePerNightCents: 380000,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000',
    description: 'Breathtaking ocean views with a nautical theme and luxury amenities.',
    features: ['King Bed', 'Ocean View', 'Mini Bar']
  },
  {
    id: 'room-5',
    tenant_id: DEFAULT_TENANT_ID,
    property_id: DEFAULT_PROPERTY_ID,
    name: 'Sunset Panorama Room',
    pricePerNightCents: 310000,
    imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=1000',
    description: 'Perfectly positioned to catch the golden hour over the western horizon.',
    features: ['King Bed', 'Floor Ceiling Windows', 'Lounge Area']
  },
  {
    id: 'room-6',
    tenant_id: DEFAULT_TENANT_ID,
    property_id: DEFAULT_PROPERTY_ID,
    name: 'Royal Heritage Suite',
    pricePerNightCents: 520000,
    imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1000',
    description: 'Classic luxury featuring hand-carved furniture and premium silk linens.',
    features: ['Imperial Bed', 'Butler Service', 'Walk-in Closet']
  },
  {
    id: 'room-7',
    tenant_id: DEFAULT_TENANT_ID,
    property_id: DEFAULT_PROPERTY_ID,
    name: 'Serene Zen Den',
    pricePerNightCents: 260000,
    imageUrl: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&q=80&w=1000',
    description: 'A minimalist approach to luxury, designed for ultimate relaxation.',
    features: ['Queen Bed', 'Yoga Mat', 'Ambient Lighting']
  },
  {
    id: 'room-8',
    tenant_id: DEFAULT_TENANT_ID,
    property_id: DEFAULT_PROPERTY_ID,
    name: 'Coastal Breeze Balcony',
    pricePerNightCents: 340000,
    imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=1000',
    description: 'Fresh, airy and light. This room captures the essence of coastal living.',
    features: ['Queen Bed', 'Private Balcony', 'Outdoor Seating']
  }
];
