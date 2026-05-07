package com.ewa.modules.utility;

import com.ewa.modules.utility.dto.BillPayRequest;
import com.ewa.modules.utility.dto.BillPayResponse;
import com.ewa.modules.utility.dto.BillQueryRequest;
import com.ewa.modules.utility.dto.BillQueryResponse;
import com.ewa.modules.utility.dto.TopupRequest;
import com.ewa.modules.utility.dto.TopupResponse;

public interface UtilityPaymentService {

    /**
     * Top up a mobile phone number.
     */
    TopupResponse topupPhone(TopupRequest request);

    /**
     * Query a utility bill (electricity, water, internet, etc.).
     */
    BillQueryResponse queryBill(BillQueryRequest request);

    /**
     * Pay a utility bill identified by billKey from a prior queryBill call.
     * Idempotent – duplicate payment on same billKey returns error.
     */
    BillPayResponse payBill(BillPayRequest request);
}
