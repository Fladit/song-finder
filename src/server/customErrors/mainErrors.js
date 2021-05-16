errorCodes = {
    UNEXPECTED_SERVER_ERROR: "0",
    REQUEST_LIMIT_ERROR: "1",
    SHORT_VIDEO_ERROR: "2",
    INCORRECT_VIDEO_LINK_ERROR: "3",
    INCORRECT_VIDEO_PARAMETERS_ERROR: "4",
    YOUTUBE_API_ERROR: "5",
    RECOGNITION_FAILED_ERROR: "6",
}

const mainErrors = {
    REQUEST_LIMIT_ERROR: {
        status: "error",
        error: {
            code: errorCodes.REQUEST_LIMIT_ERROR,
            name: "RequestLimitError",
            message: "Request limit exceeded! Not more than 3 requests per 1 minute.",
        }
    },
    SHORT_VIDEO_ERROR: {
        status: "error",
        error: {
            code: errorCodes.SHORT_VIDEO_ERROR,
            name: "ShortVideoError",
            message: "The video is too short. No less than 5 seconds.",
        }
    },
    INCORRECT_VIDEO_LINK_ERROR: {
        status: "error",
        error: {
            code: errorCodes.INCORRECT_VIDEO_LINK_ERROR,
            name: "IncorrectVideoLinkError",
            message: "Incorrect video link."
        }
    },
    INCORRECT_VIDEO_PARAMETERS_ERROR: {
        BAD_START_TIME: {
            status: "error",
            error: {
                code: `${errorCodes.INCORRECT_VIDEO_PARAMETERS_ERROR}.1`,
                name: "IncorrectVideoParametersError",
                message: "Start of video must be not less than 0"
            }
        },
        BAD_END_TIME: {
            status: "error",
            error: {
                code: `${errorCodes.INCORRECT_VIDEO_PARAMETERS_ERROR}.2`,
                name: "IncorrectVideoParametersError",
                message: "End of video must be more than start"
            }
        },
        BAD_DURATION: {
            status: "error",
            error: {
                code: `${errorCodes.INCORRECT_VIDEO_PARAMETERS_ERROR}.3`,
                name: "IncorrectVideoParametersError",
                message: "Duration of video must be 5 sec or more"
            }
        },
    },
    YOUTUBE_API_ERROR: {
        status: "error",
        error: {
            code: errorCodes.YOUTUBE_API_ERROR,
            name: "YoutubeAPIError",
            message: "Problems with interaction with the Youtube API"
        }
    },
    RECOGNITION_FAILED_ERROR: {
        status: "error",
        error: {
            code: errorCodes.RECOGNITION_FAILED_ERROR,
            name: "RecognitionFailedError",
            message: "Recognition is failed"
        }
    }

}

const createCustomError = (message, code = 0, name = "UnexpectedServerError") => {
    return {
        status: "error",
        error: {
            name,
            code,
            message,
        }
    }
}

module.exports = {mainErrors, createCustomError}
