const payload = {"event":"DEAL_CREATED","entity":{"id":4626100,"name":"Jeenali - Deal Copy","aging":0,"isNew":true,"score":0,"source":null,"company":null,"ownedBy":{"id":82300,"name":"Sana Shaikh"},"utmTerm":null,"campaign":null,"pipeline":null,"products":[{"id":499552,"name":"18 YRS & ABOVE 3 DAYS A WEEK  [Mon-Wed- Fri] | Yearly","price":{"value":15000,"currencyId":431,"currencyName":"INR","currencyDisplayName":"India Rupees"},"units":null,"category":null,"discount":{"type":"PERCENTAGE","value":0},"quantity":1,"hsnSacCode":null,"countryOfOrigin":null,"customFieldValues":{}}],"createdAt":"2026-08-06T11:11:48.389Z","createdBy":{"id":82299,"name":"Rushish Mewada"},"deletedAt":null,"deletedBy":null,"subSource":null,"taskDueOn":null,"updatedAt":"2026-08-06T11:11:48.389Z","updatedBy":{"id":82299,"name":"Rushish Mewada"},"utmMedium":null,"utmSource":null,"importedBy":null,"utmContent":null,"actualValue":{"value":15000,"currencyId":431,"currencyName":"INR","currencyDisplayName":"India Rupees"},"utmCampaign":null,"createdViaId":"82299","deletedViaId":null,"partPayments":[],"updatedViaId":null,"convertedLeads":null,"createdViaName":"User","createdViaType":"Web","deletedViaName":null,"deletedViaType":null,"estimatedValue":{"value":15000,"currencyId":431,"currencyName":"INR","currencyDisplayName":"India Rupees"},"updatedViaName":null,"updatedViaType":null,"forecastingType":null,"actualClosureDate":null,"customFieldValues":{"cfPaymentMode":{"id":202571,"name":"Cash"},"cfPaymentStatus":{"id":202568,"name":"Paid"},"cfMembershipStatus":{"id":202565,"name":"Active"}},"associatedContacts":[],"estimatedClosureOn":null,"meetingScheduledOn":null,"pipelineStageReason":null,"actualValueExchangeDate":"2026-08-06T11:11:48.382Z","actualValueExchangeRate":{"431":1},"latestActivityCreatedAt":null,"estimatedValueExchangeDate":"2026-08-06T11:11:48.386Z","estimatedValueExchangeRate":{"431":1}},"eventId":"1105426b-e45f-4d02-b6b2-e560b44a4b66","tenantId":21720,"oldEntity":null,"webhookId":6630,"entityType":"deal"};

fetch('https://kylas.asmitaclub.com/api/webhooks/incoming/kylas/deals/create', { 
  method: 'POST', 
  headers: { 
    'Content-Type': 'application/json', 
    'Authorization': 'Bearer 62wTyENtCd8ub3lfSfZY4ALid1vvEa' 
  }, 
  body: JSON.stringify(payload) 
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
