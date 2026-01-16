import { forwardRef } from 'react';
import type { Courier } from '../types';

interface Props {
    courier: Courier;
}

const ShippingLabel = forwardRef<HTMLDivElement, Props>(({ courier }, ref) => {
    return (
        <div
            ref={ref}
            className="p-6 font-sans leading-tight"
            style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                width: '350px',
                border: '1px solid #1f2937' // gray-800
            }}
        >
            <div className="mb-6">
                <h3 className="font-bold text-lg mb-1 underline decoration-2 underline-offset-2">From,</h3>
                <div className="pl-4 font-bold text-base">
                    <p>Moto Club Online.</p>
                    <p>Pin:- 676503</p>
                    <p>Ph:- 9995442239</p>
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg mb-1 underline decoration-2 underline-offset-2">To,</h3>
                <div className="pl-4 font-bold text-base whitespace-pre-line">
                    <p className="text-lg uppercase mb-1">{courier.customerName}</p>
                    <p>{courier.address}</p>
                    {courier.pincode && <p>Pin:- {courier.pincode}</p>}
                    <p>Ph:- {courier.phoneNumber}</p>
                </div>
            </div>

            {/* Footer with branding or tracking if needed */}
            <div
                className="mt-6 pt-2 font-normal text-xs text-center"
                style={{
                    borderTop: '1px dashed #9ca3af', // gray-400
                    color: '#6b7280' // gray-500
                }}
            >
                Order ID: {courier.slipNo || courier.trackingId}
            </div>
        </div>
    );
});

ShippingLabel.displayName = 'ShippingLabel';

export default ShippingLabel;
