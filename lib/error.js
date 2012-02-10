
MAX_ERRORS = 20;

function TracedError(path, message, exceptionClass, params) {
	this.toJSON = function() {
		var timestamp = 0; // the collector throws this out
		return [timestamp, path, message, exceptionClass, params];
	}
}

function createError(transaction) {
	var message = transaction.statusMessage;
	if (!message) {
		message = "HttpError " + transaction.statusCode;
	}
	var params = {'request_uri': transaction.url};
	// FIXME request_params, custom_params
	
	return new TracedError(transaction.scope, message, message, params);
}

function ErrorService(logger, config) {
	var self = this;
	var errorCount = 0;
	var errors = [];
	function ignoreStatusCode() {
		return false;
	}
	
	function noticeError(transaction) {
		errorCount++;
		if (errors.length < MAX_ERRORS) {
			logger.debug("Capturing traced error");
			errors.push(createError(transaction));
		}
	}
	
	this.getErrorCount = function() {
		return errorCount;
	}
	
	this.onBeforeHarvest = function(statsEngine, nrService) {
		statsEngine.getUnscopedStats().getStats("Errors/all").incrementCallCount(errorCount)
	}
	
	this.onTransactionFinished = function(transaction) {
		if (transaction.statusCode && transaction.statusCode >= 400) {
			if (!ignoreStatusCode(transaction.statusCode)) {
				noticeError(transaction);
			}
		}
	}
}


exports.ErrorService = ErrorService;
