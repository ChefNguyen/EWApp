package com.ewa.modules.payment.sepay;

public class SePayClientException extends RuntimeException {

    public SePayClientException(String message) {
        super(message);
    }

    public SePayClientException(String message, Throwable cause) {
        super(message, cause);
    }
}
