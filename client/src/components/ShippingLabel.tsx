import React, { forwardRef } from 'react';
import type { Courier } from '../types';

interface Props {
    courier: Courier;
}

const ShippingLabel = forwardRef<HTMLDivElement, Props>(({ courier }, ref) => {
    return (
        <div ref={ref} className="bg-white p-6 border border-gray-800 w-[350px] text-black font-sans leading-tight">
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
            <div className="mt-6 pt-2 border-t border-dashed border-gray-400 text-xs text-center text-gray-500 font-normal">
                Order ID: {courier.slipNo || courier.trackingId}
            </div>
        </div>
    );
});

ShippingLabel.displayName = 'ShippingLabel';

export default ShippingLabel;
