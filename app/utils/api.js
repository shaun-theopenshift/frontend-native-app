export const API_BASE_URL = "https://api.theopenshift.com";

export async function apiRequest(
    endpoint,
    method = "GET", 
    body,
    accessToken 
) {
    try {
        if (!accessToken) {
            throw new Error("No access token available. Please ensure the user is authenticated.");
        }

        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${accessToken}`, 
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            if (errorText.includes('User already has a role assigned')) {
                throw new Error('You have already completed your profile or have a role assigned. If you believe this is a mistake, please contact support.');
            }
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // Handle empty response
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Wrapper to pass accessToken to apiRequest for convenience
const createApiWrapper = (getAccessToken) => ({
    updateStaffProfile: (data) =>
        apiRequest('/v1/users/user', 'POST', data, getAccessToken()),

    getProfile: () => apiRequest('/v1/users/me', 'GET', undefined, getAccessToken()),

    createBooking: (data) => apiRequest('/v1/bookings/new', 'POST', data, getAccessToken()),

    getMyBookings: () => apiRequest('/v1/bookings/my_bookings', 'GET', undefined, getAccessToken()),

    getBookingById: (booking_id) => apiRequest(`/v1/bookings/${booking_id}`, 'GET', undefined, getAccessToken()),

    cancelBooking: (booking_id) => apiRequest(`/v1/bookings/cancel?booking_id=${booking_id}`, 'PATCH', undefined, getAccessToken()),

    editBooking: (booking_id, data) => apiRequest(`/v1/bookings/${booking_id}`, 'PATCH', data, getAccessToken()),

    searchBookings: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/v1/users/search_bookings?${query}`, 'GET', undefined, getAccessToken());
    },

    getOrgById: (org_id) => apiRequest(`/v1/orgs/${org_id}`, 'GET', undefined, getAccessToken()),

    sendJobRequest: (booking_id, rate, comment) => apiRequest(`/v1/bookings/request`, 'POST', { booking_id, rate, comment }, getAccessToken()),

    getMyRequests: (booking_id) => {
        const query = booking_id ? `?booking_id=${booking_id}` : '';
        return apiRequest(`/v1/bookings/my_requests${query}`, 'GET', undefined, getAccessToken());
    },

    respondToRequest: (request_id, approve) =>
        apiRequest(`/v1/bookings/request_response/${request_id}?approve=${approve}`, 'POST', undefined, getAccessToken()),

    getApplicantsForJob: (booking_id) =>
        createApiWrapper(getAccessToken).getMyRequests(booking_id),

    getUserProfileById: (user_id) => apiRequest(`/v1/users/${user_id}`, 'GET', undefined, getAccessToken()),

    checkInBooking: (booking_id, checkOut = false) =>
        apiRequest(
            `/v1/bookings/timesheet/check_in/${booking_id}${checkOut ? '?check_out=true' : ''}`,'POST', undefined, getAccessToken()),

    sendTimesheet: (booking_id, data) =>
        apiRequest(`/v1/bookings/timesheet/request/${booking_id}`, 'POST', data, getAccessToken()),

    approveTimesheet: (booking_id, approve, amount) =>
        apiRequest(
            `/v1/bookings/timesheet/request_response/${booking_id}?approve=${approve}`,'POST', amount !== undefined ? { amount } : undefined, getAccessToken()),

    createBookingPaymentSession: async (bookingId) => {
        return apiRequest(`/v1/payments/booking_payment?booking_id=${bookingId}`, 'POST', {}, getAccessToken());
    },

    getStripeDashboardLink: () => apiRequest('/v1/payments/dashboard', 'GET', undefined, getAccessToken()),
});

export default createApiWrapper;