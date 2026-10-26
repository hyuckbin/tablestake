package com.tablestake.global.error;

import java.util.List;

public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final ErrorCode errorCode;
    private final transient List<String> details;

    public BusinessException(ErrorCode errorCode) {
        this(errorCode, List.of());
    }

    public BusinessException(ErrorCode errorCode, String detail) {
        this(errorCode, List.of(detail));
    }

    public BusinessException(ErrorCode errorCode, List<String> details) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = List.copyOf(details);
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public List<String> getDetails() {
        return details;
    }
}
