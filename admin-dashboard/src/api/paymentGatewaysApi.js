import API from "./api";

// router.get("/payment-methods", protectAdmin, getPaymentMethods);
// router.post("/payment-methods", protectAdmin, createPaymentMethod);
// router.put("/payment-methods/:id", protectAdmin, updatePaymentMethod);
// router.delete("/payment-methods/:id", protectAdmin, deletePaymentMethod);
// router.get("/payment-methods/video/tutorial", protectAdmin, getDepositVideo);
// router.put("/payment-methods/video/tutorial", protectAdmin, updateDepositVideo);

export const getPaymentMethods = async () => {
    try {
        const response = await API.get("/admin/payment-methods");
        return response.data;
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        throw error;
    }
};

export const createPaymentMethod = async (paymentMethodData) => {
    try {
        const response = await API.post(
            "/admin/payment-methods",
            paymentMethodData
        );
        return response.data;
    } catch (error) {
        console.error("Error creating payment method:", error);
        throw error;
    }
};

export const updatePaymentMethod = async (id, paymentMethodData) => {
    const response = await API.put(`/admin/payment-methods/${id}`, paymentMethodData)
    return response.data;
}

export const deletePaymentMethod = async (id) => {
    const response = await API.delete(`/admin/payment-methods/${id}`)
    return response.data;
}

export const getDepositVideo = async () => {
    const response = await API.get("/admin/payment-methods/video/tutorial")
    return response.data;
}

export const updateDepositVideo = async (videoData) => {
    const response = await API.put("/admin/payment-methods/video/tutorial", videoData)
    return response.data;
}