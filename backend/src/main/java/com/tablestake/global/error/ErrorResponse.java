package com.tablestake.global.error;

import java.util.List;

/**
 * 모든 에러 응답의 공통 형식. 프론트는 code로 분기하고 message·details를 그대로 보여준다.
 */
public record ErrorResponse(String code, String message, List<String> details) {

    public static ErrorResponse of(ErrorCode errorCode, List<String> details) {
        return new ErrorResponse(errorCode.name(), errorCode.getMessage(), details);
    }
}
