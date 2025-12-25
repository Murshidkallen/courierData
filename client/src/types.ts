// Product Interface
export interface Product {
    id?: number; // Optional for new creations
    name: string;
    cost: number;
    price: number;
    courierId?: number;
}


export interface SalesExecutive {
    id: number;
    name: string;
    rate: number;
}

export interface Invoice {
    id: number;
    amount: number;
    month: string;
    status: 'Pending' | 'Paid' | 'Rejected';
    createdAt: string;
    user?: { username: string; role: string };
}

export interface Partner {
    id: number;
    name: string;
    rate?: number;
}

export interface Courier {
    id: number;
    slipNo?: string | null;
    date: string | Date;
    unit?: string | null;
    customerName: string;
    phoneNumber?: string | null;
    products: Product[];
    salesExecutive?: SalesExecutive | null;
    salesExecutiveId?: number | null;
    commissionPct?: number | null;
    commissionAmount?: number | null;
    courierPaid?: number | null;
    totalPaid?: number | null;
    address?: string | null;
    pincode?: string | null; // New
    courierCost?: number | null;
    status?: string;
    trackingId: string;
    packingCost?: number | null;
    profit?: number | null;

    partner?: Partner | null;
    partnerId?: number | null;

    createdAt?: string | Date;
    updatedAt?: string | Date;
}
