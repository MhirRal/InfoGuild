import React from 'react';

export default function ApplicationLogo({ isDashboard }) {
    const logoSize = isDashboard ? '50px' : '100px';

    return (
        <img src="/logo/logoo.jpg" style={{ width: logoSize }} alt="Logo" />
    );
}
