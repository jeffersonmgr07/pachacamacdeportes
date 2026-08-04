/**
 * Pacha Deportes - Inscripciones y pagos de talleres municipales 2026.
 * Este archivo se agrega al mismo proyecto de Apps Script usado por alquiler de campos.
 * Reutiliza las funciones compartidas de Code.gs: ss_(), rowsObjects_(), appendObject_(),
 * updateFields_(), ensureSheet_(), clean_(), digits_(), bool_(), html_(), emailShell_(), etc.
 */

function ensureWorkshopSheets_() {
  const ss = ss_();
  ensureSheet_(ss, RENTAL_CFG.SHEETS.WORKSHOP_CATALOG, [
    'workshopId','sportCode','name','description','scheduleText','location','startDate','endDate',
    'localFee','externalFee','minAge','maxAge','active','sortOrder'
  ]);
  ensureSheet_(ss, RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS, [
    'enrollmentCode','workshopId','workshopName','studentPaternalSurname','studentMaternalSurname',
    'studentNames','studentFullName','studentDni','birthDate','ageAtEnrollment','sex','schoolName',
    'address','residenceDistrict','residenceProvince','residenceDepartment','monthlyFee',
    'guardianFullName','guardianDni','guardianPhone','guardianEmail','declarationAccepted','declarationText',
    'status','statusReason','createdAt','initialPaymentDeadline','cancelIfUnpaidAt','activatedAt',
    'cancelledAt','cancelledBy','cancellationEmailSent'
  ]);
  ensureSheet_(ss, RENTAL_CFG.SHEETS.WORKSHOP_INVOICES, [
    'invoiceId','enrollmentCode','workshopId','workshopName','studentDni','sequence','label','dueDate',
    'amount','status','createdAt','paidAt','paymentOrderCode','receiptNumber','confirmedBy'
  ]);
  ensureSheet_(ss, RENTAL_CFG.SHEETS.WORKSHOP_ORDERS, [
    'orderCode','orderType','enrollmentCode','guardianDni','invoiceIdsJson','total','status','createdAt',
    'paymentDeadline','paidAt','receiptNumber','confirmedBy','emailSent','expiredAt'
  ]);
  syncWorkshopCatalog_();
}

function syncWorkshopCatalog_() {
  const catalog = [
    {
      workshopId:'TAL_VOLEY_2026', sportCode:'VOLEY', name:'Taller de vóley',
      description:'Entrenamiento formativo de vóley para niñas, niños y adolescentes.',
      scheduleText:'Lunes, martes y viernes · 3:00 p. m. a 6:00 p. m.',
      location:'Coliseo Deportivo Municipal de Pachacámac',
      startDate:new Date(2026,7,1), endDate:new Date(2026,10,30),
      localFee:25, externalFee:30, minAge:6, maxAge:17, active:true, sortOrder:1
    },
    {
      workshopId:'TAL_FUTBOL_2026', sportCode:'FUTBOL', name:'Taller de fútbol',
      description:'Formación técnica y recreativa de fútbol para menores del distrito.',
      scheduleText:'Lunes, miércoles y viernes · 4:00 p. m. a 6:00 p. m.',
      location:'Estadio Municipal de Pachacámac',
      startDate:new Date(2026,7,1), endDate:new Date(2026,10,30),
      localFee:25, externalFee:30, minAge:6, maxAge:17, active:true, sortOrder:2
    },
    {
      workshopId:'TAL_BASQUET_2026', sportCode:'BASQUET', name:'Taller de básquet',
      description:'Taller municipal de fundamentos, coordinación y juego en equipo.',
      scheduleText:'Miércoles · 4:00 p. m. a 6:00 p. m. y sábados · 10:00 a. m. a 12:00 p. m.',
      location:'Coliseo Deportivo Municipal de Pachacámac',
      startDate:new Date(2026,7,1), endDate:new Date(2026,10,30),
      localFee:25, externalFee:30, minAge:6, maxAge:17, active:true, sortOrder:3
    }
  ];
  const rows = rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_CATALOG);
  catalog.forEach(item => {
    const existing = rows.find(row => String(row.workshopId) === item.workshopId);
    if (existing) {
      // Se conservan cambios hechos manualmente en Google Sheets. Solo completa celdas vacías.
      const missing = {};
      Object.keys(item).forEach(key => {
        if (existing[key] === '' || existing[key] == null) missing[key] = item[key];
      });
      if (Object.keys(missing).length) updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_CATALOG, existing._row, missing);
    } else {
      appendObject_(RENTAL_CFG.SHEETS.WORKSHOP_CATALOG, item);
    }
  });
}

function getWorkshopCatalog_() {
  ensureWorkshopSheets_();
  const now = new Date();
  const workshops = rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_CATALOG)
    .filter(row => bool_(row.active) && row.endDate && new Date(row.endDate) >= startDay_(now))
    .sort((a,b) => Number(a.sortOrder || 999) - Number(b.sortOrder || 999))
    .map(publicWorkshopCatalogItem_);
  return {ok:true, serverNow:now.toISOString(), workshops:workshops};
}

function publicWorkshopCatalogItem_(row) {
  return {
    workshopId:clean_(row.workshopId),
    sportCode:clean_(row.sportCode),
    name:clean_(row.name),
    description:clean_(row.description),
    scheduleText:clean_(row.scheduleText),
    location:clean_(row.location),
    startDate:new Date(row.startDate).toISOString(),
    endDate:new Date(row.endDate).toISOString(),
    localFee:Number(row.localFee || 25),
    externalFee:Number(row.externalFee || 30),
    minAge:Number(row.minAge || 6),
    maxAge:Number(row.maxAge || 17)
  };
}

function createWorkshopEnrollment_(p) {
  ensureWorkshopSheets_();
  expireWorkshopData_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const workshop = workshopById_(p.workshopId);
    if (!workshop || !bool_(workshop.active)) throw new Error('El taller seleccionado no está habilitado.');
    const now = new Date();
    if (new Date(workshop.endDate) < startDay_(now)) throw new Error('El periodo de este taller ya finalizó.');

    const data = validateWorkshopEnrollmentPayload_(p, workshop, now);
    const duplicate = rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS).find(row =>
      digits_(row.studentDni) === data.studentDni &&
      String(row.workshopId) === String(workshop.workshopId) &&
      ['PENDIENTE_PAGO','ACTIVO'].indexOf(String(row.status).toUpperCase()) !== -1
    );
    if (duplicate) throw new Error('El menor ya tiene una matrícula vigente o pendiente en este taller. Código: ' + duplicate.enrollmentCode);

    const enrollmentCode = uniqueWorkshopEnrollmentCode_(data.guardianDni);
    const paymentDeadline = nextWorkshopOrderDeadline_(now);
    const cancelIfUnpaidAt = addWorkshopBusinessDaysDeadline_(now, 3);
    const monthlyFee = isPachacamacDistrict_(data.residenceDistrict) ? Number(workshop.localFee || 25) : Number(workshop.externalFee || 30);
    const studentFullName = [data.studentNames, data.studentPaternalSurname, data.studentMaternalSurname].filter(Boolean).join(' ');

    appendObject_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS, {
      enrollmentCode:enrollmentCode,
      workshopId:workshop.workshopId,
      workshopName:workshop.name,
      studentPaternalSurname:data.studentPaternalSurname,
      studentMaternalSurname:data.studentMaternalSurname,
      studentNames:data.studentNames,
      studentFullName:studentFullName,
      studentDni:data.studentDni,
      birthDate:data.birthDate,
      ageAtEnrollment:data.age,
      sex:data.sex,
      schoolName:data.schoolName,
      address:data.address,
      residenceDistrict:data.residenceDistrict,
      residenceProvince:data.residenceProvince,
      residenceDepartment:data.residenceDepartment,
      monthlyFee:monthlyFee,
      guardianFullName:data.guardianFullName,
      guardianDni:data.guardianDni,
      guardianPhone:data.guardianPhone,
      guardianEmail:data.guardianEmail,
      declarationAccepted:true,
      declarationText:data.declarationText,
      status:'PENDIENTE_PAGO',
      statusReason:'Pendiente del primer pago mensual',
      createdAt:now,
      initialPaymentDeadline:paymentDeadline,
      cancelIfUnpaidAt:cancelIfUnpaidAt,
      activatedAt:'', cancelledAt:'', cancelledBy:'', cancellationEmailSent:false
    });

    const invoiceRows = createWorkshopInvoices_(enrollmentCode, workshop, data.studentDni, monthlyFee, now);
    if (!invoiceRows.length) throw new Error('No fue posible generar las cuotas del taller.');
    const firstInvoice = invoiceRows[0];
    const order = createWorkshopOrderRecord_(enrollmentCode, data.guardianDni, [firstInvoice.invoiceId], 'INICIAL', paymentDeadline);
    const enrollment = findWorkshopEnrollment_(enrollmentCode);
    let emailWarning = '';
    try { sendWorkshopEnrollmentCreated_(enrollment, workshop, order); }
    catch (emailError) { emailWarning = 'La inscripción se guardó, pero no se pudo enviar el correo: ' + (emailError.message || emailError); }
    return {ok:true, enrollment:publicWorkshopEnrollment_(enrollment), order:publicWorkshopOrder_(order), warning:emailWarning};
  } finally {
    lock.releaseLock();
  }
}

function validateWorkshopEnrollmentPayload_(p, workshop, now) {
  const required = [
    [p.childPaternalSurname || p.studentPaternalSurname,'apellido paterno del menor'],
    [p.childMaternalSurname || p.studentMaternalSurname,'apellido materno del menor'],
    [p.childNames || p.studentNames,'nombres del menor'],
    [p.schoolName,'institución educativa'], [p.address,'dirección'],
    [p.residenceDistrict,'distrito'], [p.residenceProvince,'provincia'],
    [p.residenceDepartment,'departamento'], [p.guardianFullName,'nombre completo del apoderado']
  ];
  required.forEach(item => { if (!clean_(item[0])) throw new Error('Completa el campo ' + item[1] + '.'); });
  const studentDni = digits_(p.childDni || p.studentDni);
  const guardianDni = digits_(p.guardianDni);
  const guardianPhone = digits_(p.guardianPhone);
  const guardianEmail = clean_(p.guardianEmail).toLowerCase();
  if (studentDni.length !== 8) throw new Error('El DNI del menor debe tener 8 dígitos.');
  if (guardianDni.length !== 8) throw new Error('El DNI del apoderado debe tener 8 dígitos.');
  if (guardianPhone.length < 9) throw new Error('El celular del apoderado no es válido.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) throw new Error('El correo del apoderado no es válido.');
  if (!bool_(p.declarationAccepted)) throw new Error('Debes aceptar la declaración jurada.');
  if (['M','F'].indexOf(String(p.sex || '').toUpperCase()) === -1) throw new Error('Selecciona el sexo del menor.');

  const birthDate = parseWorkshopDate_(p.birthDate);
  if (isNaN(birthDate)) throw new Error('La fecha de nacimiento no es válida.');
  const age = workshopAge_(birthDate, now);
  const minAge = Number(workshop.minAge || 6), maxAge = Number(workshop.maxAge || 17);
  if (age < minAge || age > maxAge) throw new Error('Solo pueden inscribirse menores de ' + minAge + ' a ' + maxAge + ' años cumplidos.');

  return {
    studentPaternalSurname:clean_(p.childPaternalSurname || p.studentPaternalSurname),
    studentMaternalSurname:clean_(p.childMaternalSurname || p.studentMaternalSurname),
    studentNames:clean_(p.childNames || p.studentNames),
    studentDni:studentDni,
    birthDate:birthDate,
    age:age,
    sex:String(p.sex).toUpperCase(),
    schoolName:clean_(p.schoolName),
    address:clean_(p.address),
    residenceDistrict:clean_(p.residenceDistrict),
    residenceProvince:clean_(p.residenceProvince),
    residenceDepartment:clean_(p.residenceDepartment),
    guardianFullName:clean_(p.guardianFullName),
    guardianDni:guardianDni,
    guardianPhone:guardianPhone,
    guardianEmail:guardianEmail,
    declarationText:workshopDeclarationText_(clean_(p.guardianFullName), guardianDni, [clean_(p.childNames || p.studentNames), clean_(p.childPaternalSurname || p.studentPaternalSurname), clean_(p.childMaternalSurname || p.studentMaternalSurname)].filter(Boolean).join(' '))
  };
}

function createWorkshopInvoices_(enrollmentCode, workshop, studentDni, monthlyFee, enrollmentDate) {
  const dates = workshopInvoiceDates_(enrollmentDate, new Date(workshop.endDate));
  const created = new Date();
  const rows = [];
  dates.forEach((dueDate, index) => {
    const invoice = {
      invoiceId:enrollmentCode + '-C' + String(index + 1).padStart(2,'0'),
      enrollmentCode:enrollmentCode,
      workshopId:workshop.workshopId,
      workshopName:workshop.name,
      studentDni:studentDni,
      sequence:index + 1,
      label:workshopMonthLabel_(dueDate),
      dueDate:dueDate,
      amount:monthlyFee,
      status:'PENDIENTE',
      createdAt:created,
      paidAt:'', paymentOrderCode:'', receiptNumber:'', confirmedBy:''
    };
    appendObject_(RENTAL_CFG.SHEETS.WORKSHOP_INVOICES, invoice);
    rows.push(invoice);
  });
  return rows;
}

function workshopInvoiceDates_(start, end) {
  const result = [];
  const first = startDay_(start);
  const finalDate = startDay_(end);
  const originalDay = first.getDate();
  let index = 0;
  while (index < 24) {
    const date = addMonthsClamped_(first, index, originalDay);
    if (date > finalDate) break;
    result.push(date);
    index++;
  }
  return result;
}

function addMonthsClamped_(base, months, originalDay) {
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(originalDay, lastDay));
  target.setHours(0,0,0,0);
  return target;
}

function createWorkshopOrderRecord_(enrollmentCode, guardianDni, invoiceIds, orderType, deadline) {
  const invoices = workshopInvoicesForEnrollment_(enrollmentCode).filter(row => invoiceIds.indexOf(String(row.invoiceId)) !== -1);
  if (!invoices.length) throw new Error('No hay cuotas válidas para la orden de pago.');
  const total = invoices.reduce((sum,row) => sum + Number(row.amount || 0), 0);
  const orderCode = uniqueWorkshopOrderCode_(guardianDni);
  appendObject_(RENTAL_CFG.SHEETS.WORKSHOP_ORDERS, {
    orderCode:orderCode,
    orderType:orderType || 'CUOTAS',
    enrollmentCode:enrollmentCode,
    guardianDni:guardianDni,
    invoiceIdsJson:JSON.stringify(invoiceIds),
    total:total,
    status:'PENDIENTE',
    createdAt:new Date(),
    paymentDeadline:deadline || nextWorkshopOrderDeadline_(new Date()),
    paidAt:'', receiptNumber:'', confirmedBy:'', emailSent:false, expiredAt:''
  });
  return findWorkshopOrder_(orderCode);
}

function lookupWorkshopAccount_(p) {
  ensureWorkshopSheets_();
  expireWorkshopData_();
  const guardianDni = digits_(p.guardianDni);
  const surname = normalizeWorkshopText_(p.guardianSurname);
  if (guardianDni.length !== 8 || surname.length < 2) throw new Error('Ingresa el DNI y un apellido válido del apoderado.');
  const enrollments = authenticatedWorkshopEnrollments_(guardianDni, surname);
  if (!enrollments.length) return {ok:false,message:'No encontramos matrículas con esos datos. Revisa el DNI y el apellido ingresados.'};
  return {ok:true,enrollments:enrollments.map(publicWorkshopEnrollment_)};
}

function createWorkshopPaymentOrder_(p) {
  ensureWorkshopSheets_();
  expireWorkshopData_();
  const guardianDni = digits_(p.guardianDni);
  const surname = normalizeWorkshopText_(p.guardianSurname);
  const enrollmentCode = clean_(p.enrollmentCode).toUpperCase();
  const invoiceIds = Array.isArray(p.invoiceIds) ? p.invoiceIds.map(String) : [];
  const enrollments = authenticatedWorkshopEnrollments_(guardianDni, surname);
  const enrollment = enrollments.find(row => String(row.enrollmentCode).toUpperCase() === enrollmentCode);
  if (!enrollment) throw new Error('No se pudo validar la matrícula con los datos del apoderado.');
  if (String(enrollment.status).toUpperCase().indexOf('BAJA') !== -1) throw new Error('La matrícula está dada de baja. Debes realizar una nueva inscripción.');
  if (!invoiceIds.length) throw new Error('Selecciona al menos una cuota pendiente.');

  const pending = workshopInvoicesForEnrollment_(enrollmentCode).filter(row =>
    invoiceIds.indexOf(String(row.invoiceId)) !== -1 && String(row.status).toUpperCase() === 'PENDIENTE'
  );
  if (pending.length !== invoiceIds.length) throw new Error('Una de las cuotas seleccionadas ya fue pagada o no pertenece a la matrícula.');

  const normalizedIds = pending.map(row => String(row.invoiceId)).sort();
  const activeExisting = rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_ORDERS).find(order =>
    String(order.enrollmentCode).toUpperCase() === enrollmentCode &&
    String(order.status).toUpperCase() === 'PENDIENTE' &&
    new Date(order.paymentDeadline) > new Date() &&
    workshopSameIds_(workshopOrderInvoiceIds_(order), normalizedIds)
  );
  if (activeExisting) return {ok:true,order:publicWorkshopOrder_(activeExisting),reused:true};

  const order = createWorkshopOrderRecord_(enrollmentCode, guardianDni, normalizedIds, 'CUOTAS', nextWorkshopOrderDeadline_(new Date()));
  let emailWarning = '';
  try { sendWorkshopPaymentOrder_(enrollment, order); }
  catch (emailError) { emailWarning = 'La orden se generó, pero no se pudo enviar el correo: ' + (emailError.message || emailError); }
  return {ok:true,order:publicWorkshopOrder_(findWorkshopOrder_(order.orderCode)),warning:emailWarning};
}

function cashierWorkshopLookup(query) {
  requireCashier_();
  ensureWorkshopSheets_();
  expireWorkshopData_();
  const key = clean_(query).toUpperCase();
  if (!key) return {ok:false,message:'Ingresa un código de matrícula u orden de pago.'};
  const order = findWorkshopOrder_(key);
  const enrollment = order ? findWorkshopEnrollment_(order.enrollmentCode) : findWorkshopEnrollment_(key);
  if (!enrollment) return {ok:false,message:'No se encontró la matrícula ni la orden de pago.'};
  const orderUsable = order && String(order.status).toUpperCase() === 'PENDIENTE' && new Date(order.paymentDeadline) >= new Date();
  return {
    ok:true,
    enrollment:publicWorkshopEnrollment_(enrollment),
    order:order ? publicWorkshopOrder_(order) : null,
    orderWarning:order && !orderUsable ? 'Esta orden está ' + workshopOrderStatusLabel_(order.status) + '. Para cobrar, busca el código de matrícula o solicita una nueva orden.' : '',
    selectedInvoiceIds:orderUsable ? workshopOrderInvoiceIds_(order) : []
  };
}

function cashierConfirmWorkshopPayment(enrollmentCode, invoiceIds, receiptNumber, sourceOrderCode) {
  const cashier = requireCashier_();
  ensureWorkshopSheets_();
  expireWorkshopData_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const enrollment = findWorkshopEnrollment_(enrollmentCode);
    if (!enrollment) throw new Error('La matrícula no existe.');
    if (String(enrollment.status).toUpperCase().indexOf('BAJA') !== -1) throw new Error('La matrícula está dada de baja y no admite pagos.');
    const ids = Array.isArray(invoiceIds) ? invoiceIds.map(String) : [];
    if (!ids.length) throw new Error('Selecciona al menos una cuota para registrar el pago.');
    const invoices = workshopInvoicesForEnrollment_(enrollment.enrollmentCode).filter(row => ids.indexOf(String(row.invoiceId)) !== -1);
    if (invoices.length !== ids.length) throw new Error('Una cuota seleccionada no pertenece a esta matrícula.');
    if (invoices.some(row => String(row.status).toUpperCase() !== 'PENDIENTE')) throw new Error('Una cuota seleccionada ya fue pagada o anulada.');

    let order = sourceOrderCode ? findWorkshopOrder_(sourceOrderCode) : null;
    const sortedIds = ids.slice().sort();
    if (sourceOrderCode) {
      if (!order || String(order.enrollmentCode) !== String(enrollment.enrollmentCode)) throw new Error('La orden de pago no pertenece a esta matrícula.');
      if (String(order.status).toUpperCase() !== 'PENDIENTE' || new Date(order.paymentDeadline) < new Date()) throw new Error('La orden de pago está vencida. Genera una nueva orden o busca directamente el código de matrícula.');
      if (!workshopSameIds_(workshopOrderInvoiceIds_(order), sortedIds)) throw new Error('Las cuotas seleccionadas no coinciden con la orden de pago.');
    } else {
      order = createWorkshopOrderRecord_(enrollment.enrollmentCode, enrollment.guardianDni, sortedIds, 'CAJA', new Date(Date.now() + 60000));
    }

    const now = new Date();
    const receipt = clean_(receiptNumber);
    invoices.forEach(invoice => updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_INVOICES, invoice._row, {
      status:'PAGADO', paidAt:now, paymentOrderCode:order.orderCode, receiptNumber:receipt, confirmedBy:cashier
    }));
    updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_ORDERS, order._row, {
      status:'PAGADO', paidAt:now, receiptNumber:receipt, confirmedBy:cashier
    });
    if (String(enrollment.status).toUpperCase() === 'PENDIENTE_PAGO') {
      updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS, enrollment._row, {
        status:'ACTIVO', statusReason:'Primer pago confirmado', activatedAt:now
      });
    }
    const updatedEnrollment = findWorkshopEnrollment_(enrollment.enrollmentCode);
    let message = 'Pago de taller confirmado y correo enviado.';
    try { sendWorkshopPaymentConfirmation_(updatedEnrollment, invoices, order, receipt); }
    catch (emailError) { message = 'Pago confirmado. No se pudo enviar el correo: ' + (emailError.message || emailError); }
    return {ok:true,message:message,enrollment:publicWorkshopEnrollment_(updatedEnrollment)};
  } finally {
    lock.releaseLock();
  }
}

function cashierGetWorkshopDashboard(filters) {
  requireWorkshopAdmin_();
  ensureWorkshopSheets_();
  expireWorkshopData_();
  filters = filters || {};
  const workshopId = clean_(filters.workshopId);
  const statusFilter = clean_(filters.status).toUpperCase();
  let rows = rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS);
  if (workshopId) rows = rows.filter(row => String(row.workshopId) === workshopId);
  if (statusFilter) rows = rows.filter(row => String(row.status).toUpperCase() === statusFilter);
  const allInvoices = rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_INVOICES);
  const now = startDay_(new Date());
  const items = rows.map(enrollment => {
    const invoices = allInvoices.filter(invoice => String(invoice.enrollmentCode) === String(enrollment.enrollmentCode));
    const paid = invoices.filter(invoice => String(invoice.status).toUpperCase() === 'PAGADO');
    const pending = invoices.filter(invoice => String(invoice.status).toUpperCase() === 'PENDIENTE');
    const overdue = pending.filter(invoice => new Date(invoice.dueDate) < now);
    return {
      enrollmentCode:enrollment.enrollmentCode,
      workshopId:enrollment.workshopId,
      workshopName:enrollment.workshopName,
      studentFullName:enrollment.studentFullName,
      studentDni:enrollment.studentDni,
      ageAtEnrollment:Number(enrollment.ageAtEnrollment || 0),
      residenceDistrict:enrollment.residenceDistrict,
      guardianFullName:enrollment.guardianFullName,
      guardianDni:enrollment.guardianDni,
      guardianPhone:enrollment.guardianPhone,
      guardianEmail:enrollment.guardianEmail,
      monthlyFee:Number(enrollment.monthlyFee || 0),
      status:enrollment.status,
      createdAt:new Date(enrollment.createdAt).toISOString(),
      activatedAt:enrollment.activatedAt ? new Date(enrollment.activatedAt).toISOString() : '',
      paidCount:paid.length,
      pendingCount:pending.length,
      overdueCount:overdue.length,
      paidTotal:paid.reduce((sum,row) => sum + Number(row.amount || 0), 0),
      pendingTotal:pending.reduce((sum,row) => sum + Number(row.amount || 0), 0)
    };
  }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const allRows = rows;
  return {
    ok:true,
    summary:{
      total:allRows.length,
      active:allRows.filter(row => String(row.status).toUpperCase() === 'ACTIVO').length,
      pending:allRows.filter(row => String(row.status).toUpperCase() === 'PENDIENTE_PAGO').length,
      cancelled:allRows.filter(row => String(row.status).toUpperCase().indexOf('BAJA') !== -1).length
    },
    workshops:rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_CATALOG).filter(row => bool_(row.active)).map(publicWorkshopCatalogItem_),
    enrollments:items
  };
}

function cashierSetWorkshopEnrollmentStatus(enrollmentCode, newStatus, reason) {
  const admin = requireWorkshopAdmin_();
  ensureWorkshopSheets_();
  const enrollment = findWorkshopEnrollment_(enrollmentCode);
  if (!enrollment) throw new Error('Matrícula no encontrada.');
  const status = String(newStatus || '').toUpperCase();
  if (['ACTIVO','BAJA_ADMINISTRATIVA'].indexOf(status) === -1) throw new Error('Estado administrativo no válido.');
  const changes = {status:status,statusReason:clean_(reason) || (status === 'ACTIVO' ? 'Reactivación administrativa' : 'Baja administrativa')};
  if (status === 'BAJA_ADMINISTRATIVA') {
    changes.cancelledAt = new Date(); changes.cancelledBy = admin;
  } else {
    const invoices = workshopInvoicesForEnrollment_(enrollment.enrollmentCode);
    invoices.forEach(invoice => {
      if (String(invoice.status).toUpperCase() === 'ANULADO') updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_INVOICES, invoice._row, {status:'PENDIENTE'});
    });
    const hasPaid = invoices.some(invoice => String(invoice.status).toUpperCase() === 'PAGADO');
    changes.status = hasPaid ? 'ACTIVO' : 'PENDIENTE_PAGO';
    changes.statusReason = clean_(reason) || (hasPaid ? 'Reactivación administrativa' : 'Reactivada y pendiente del primer pago');
    changes.cancelledAt = ''; changes.cancelledBy = ''; changes.cancellationEmailSent = false;
    if (hasPaid) changes.activatedAt = enrollment.activatedAt || new Date();
    else changes.cancelIfUnpaidAt = addWorkshopBusinessDaysDeadline_(new Date(), 3);
  }
  updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS, enrollment._row, changes);
  return {ok:true,message:status === 'ACTIVO' ? 'Matrícula reactivada.' : 'Matrícula dada de baja.'};
}

function requireWorkshopAdmin_() {
  const email = requireCashier_();
  const allowed = (RENTAL_CFG.WORKSHOP_ADMIN_EMAILS || RENTAL_CFG.EVENT_ADMIN_EMAILS || []).map(x => String(x).toLowerCase());
  if (allowed.indexOf(email) === -1) throw new Error('Tu cuenta puede registrar pagos, pero no administrar matrículas de talleres.');
  return email;
}

function expireWorkshopData_() {
  expireWorkshopPaymentOrders_();
  expireWorkshopRegistrations_();
}

function expireWorkshopPaymentOrders_() {
  ensureWorkshopSheets_();
  const now = new Date();
  let count = 0;
  rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_ORDERS).forEach(order => {
    if (String(order.status).toUpperCase() === 'PENDIENTE' && new Date(order.paymentDeadline) < now) {
      updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_ORDERS, order._row, {status:'VENCIDO',expiredAt:now});
      count++;
    }
  });
  return count;
}

function expireWorkshopRegistrations_() {
  ensureWorkshopSheets_();
  const now = new Date();
  let count = 0;
  rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS).forEach(enrollment => {
    if (String(enrollment.status).toUpperCase() !== 'PENDIENTE_PAGO') return;
    if (!enrollment.cancelIfUnpaidAt || new Date(enrollment.cancelIfUnpaidAt) >= now) return;
    updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS, enrollment._row, {
      status:'BAJA_FALTA_PAGO', statusReason:'No se registró el primer pago dentro de tres días hábiles',
      cancelledAt:now, cancelledBy:'SISTEMA'
    });
    workshopInvoicesForEnrollment_(enrollment.enrollmentCode).forEach(invoice => {
      if (String(invoice.status).toUpperCase() === 'PENDIENTE') updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_INVOICES, invoice._row, {status:'ANULADO'});
    });
    const updated = findWorkshopEnrollment_(enrollment.enrollmentCode);
    try { sendWorkshopEnrollmentCancelled_(updated); } catch (emailError) { console.log('No se pudo enviar baja de taller: ' + (emailError.message || emailError)); }
    count++;
  });
  return count;
}

function sendWorkshopEnrollmentCreated_(enrollment, workshop, order) {
  const qrUrl = workshopOrderQrUrl_(order, enrollment);
  const html = emailShell_({
    title:'Inscripción de taller registrada',
    preheader:'La ficha fue registrada y está pendiente del primer pago.',
    status:'PAGO PENDIENTE', statusBg:'#f59e0b',
    greeting:'Hola ' + html_(enrollment.guardianFullName) + ',',
    message:'La ficha del menor fue registrada. Presenta el código o el QR en caja municipal para realizar el primer pago y activar la matrícula.',
    code:order.orderCode, codeLabel:'CÓDIGO DE PAGO', deadline:fmtDeadline_(order.paymentDeadline), qrUrl:qrUrl,
    schedulesHtml:'',
    rows:[
      ['Código de matrícula', enrollment.enrollmentCode],
      ['Alumno(a)', enrollment.studentFullName],
      ['Taller', enrollment.workshopName],
      ['Horario', workshop.scheduleText],
      ['Lugar', workshop.location],
      ['Cuota mensual', 'S/ ' + Number(enrollment.monthlyFee).toFixed(2)],
      ['Primer pago', 'S/ ' + Number(order.total).toFixed(2)],
      ['Vigencia del taller', 'Hasta el 30 de noviembre de 2026']
    ],
    note:'La orden vence en la fecha indicada. La matrícula se activa únicamente cuando caja registra el pago. Si no se confirma el primer pago dentro de tres días hábiles, la inscripción se dará de baja y deberá generarse nuevamente.'
  });
  MailApp.sendEmail({
    to:enrollment.guardianEmail, cc:RENTAL_CFG.ADMIN_EMAIL,
    subject:'Inscripción de taller ' + enrollment.enrollmentCode,
    body:'Inscripción ' + enrollment.enrollmentCode + '. Código de pago: ' + order.orderCode + '. Total: S/ ' + Number(order.total).toFixed(2),
    htmlBody:html, name:'Pacha Deportes'
  });
  updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_ORDERS, order._row, {emailSent:true});
}

function sendWorkshopPaymentOrder_(enrollment, order) {
  const qrUrl = workshopOrderQrUrl_(order, enrollment);
  const invoices = workshopInvoicesByIds_(workshopOrderInvoiceIds_(order));
  const html = emailShell_({
    title:'Nueva orden de pago de taller', preheader:'Orden para pagar cuotas pendientes.',
    status:'PAGO PENDIENTE',statusBg:'#f59e0b',
    greeting:'Hola ' + html_(enrollment.guardianFullName) + ',',
    message:'Se generó una orden para las cuotas seleccionadas. Presenta el código o el QR en caja municipal.',
    code:order.orderCode,codeLabel:'CÓDIGO DE PAGO',deadline:fmtDeadline_(order.paymentDeadline),qrUrl:qrUrl,
    schedulesHtml:'',
    rows:[
      ['Matrícula', enrollment.enrollmentCode],
      ['Alumno(a)', enrollment.studentFullName],
      ['Taller', enrollment.workshopName],
      ['Cuotas', invoices.map(row => row.label).join(', ')],
      ['Total', 'S/ ' + Number(order.total).toFixed(2)]
    ],
    note:'La orden no confirma el pago. Caja debe registrar la operación antes del vencimiento indicado.'
  });
  MailApp.sendEmail({to:enrollment.guardianEmail,cc:RENTAL_CFG.ADMIN_EMAIL,subject:'Orden de pago ' + order.orderCode,body:'Orden ' + order.orderCode + ' por S/ ' + Number(order.total).toFixed(2),htmlBody:html,name:'Pacha Deportes'});
  updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_ORDERS, order._row, {emailSent:true});
}

function sendWorkshopPaymentConfirmation_(enrollment, paidInvoices, order, receipt) {
  const allInvoices = workshopInvoicesForEnrollment_(enrollment.enrollmentCode);
  const nextPending = allInvoices.filter(row => String(row.status).toUpperCase() === 'PENDIENTE').sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const html = emailShell_({
    title:'Pago de taller confirmado',preheader:'El pago fue registrado correctamente.',
    status:'PAGADO',statusBg:'#16a34a',
    greeting:'Hola ' + html_(enrollment.guardianFullName) + ',',
    message:'La caja municipal registró correctamente el pago de las cuotas seleccionadas.',
    code:enrollment.enrollmentCode,codeLabel:'CÓDIGO DE MATRÍCULA',qrUrl:'',schedulesHtml:'',
    rows:[
      ['Alumno(a)', enrollment.studentFullName],
      ['Taller', enrollment.workshopName],
      ['Cuotas pagadas', paidInvoices.map(row => row.label).join(', ')],
      ['Total pagado', 'S/ ' + Number(order.total).toFixed(2)],
      ['Comprobante', receipt || 'Registrado en caja'],
      ['Próxima cuota', nextPending ? nextPending.label + ' - vence ' + fmtDateOnly_(nextPending.dueDate) : 'No quedan cuotas pendientes']
    ],
    note:'Conserva este correo y tu código de matrícula. Puedes consultar las cuotas desde la sección Talleres de Pacha Deportes.'
  });
  MailApp.sendEmail({to:enrollment.guardianEmail,cc:RENTAL_CFG.ADMIN_EMAIL,subject:'Pago confirmado - ' + enrollment.enrollmentCode,body:'Pago confirmado para ' + enrollment.enrollmentCode,htmlBody:html,name:'Pacha Deportes'});
}

function sendWorkshopEnrollmentCancelled_(enrollment) {
  if (bool_(enrollment.cancellationEmailSent)) return;
  const html = emailShell_({
    title:'Inscripción de taller dada de baja',preheader:'No se confirmó el primer pago dentro del plazo.',
    status:'MATRÍCULA VENCIDA',statusBg:'#b42318',
    greeting:'Hola ' + html_(enrollment.guardianFullName) + ',',
    message:'La inscripción fue dada de baja porque no se registró el primer pago dentro de los tres días hábiles establecidos.',
    code:enrollment.enrollmentCode,codeLabel:'CÓDIGO DE MATRÍCULA',qrUrl:'',schedulesHtml:'',
    rows:[['Alumno(a)',enrollment.studentFullName],['Taller',enrollment.workshopName],['Estado','Baja por falta de pago']],
    note:'Para participar, debes completar una nueva inscripción desde la página de Talleres de Pacha Deportes.'
  });
  MailApp.sendEmail({to:enrollment.guardianEmail,cc:RENTAL_CFG.ADMIN_EMAIL,subject:'Matrícula vencida ' + enrollment.enrollmentCode,body:'La matrícula ' + enrollment.enrollmentCode + ' fue dada de baja por falta de pago.',htmlBody:html,name:'Pacha Deportes'});
  updateFields_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS, enrollment._row, {cancellationEmailSent:true});
}

function workshopOrderQrUrl_(order, enrollment) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=' + encodeURIComponent(JSON.stringify({
    tipo:'TALLER', codigo:order.orderCode, matricula:enrollment.enrollmentCode, total:Number(order.total)
  }));
}

function publicWorkshopEnrollment_(enrollment) {
  const invoices = workshopInvoicesForEnrollment_(enrollment.enrollmentCode).map(publicWorkshopInvoice_);
  return {
    enrollmentCode:enrollment.enrollmentCode,
    workshopId:enrollment.workshopId,
    workshopName:enrollment.workshopName,
    studentName:enrollment.studentFullName,
    monthlyFee:Number(enrollment.monthlyFee || 0),
    status:enrollment.status,
    statusLabel:workshopStatusLabel_(enrollment.status),
    createdAt:new Date(enrollment.createdAt).toISOString(),
    cancelIfUnpaidAt:enrollment.cancelIfUnpaidAt ? new Date(enrollment.cancelIfUnpaidAt).toISOString() : '',
    invoices:invoices
  };
}

function publicWorkshopInvoice_(invoice) {
  const due = new Date(invoice.dueDate);
  return {
    invoiceId:invoice.invoiceId,
    sequence:Number(invoice.sequence || 0),
    label:invoice.label,
    dueDate:due.toISOString(),
    amount:Number(invoice.amount || 0),
    status:invoice.status,
    overdue:String(invoice.status).toUpperCase() === 'PENDIENTE' && due < startDay_(new Date()),
    paidAt:invoice.paidAt ? new Date(invoice.paidAt).toISOString() : '',
    receiptNumber:invoice.receiptNumber || ''
  };
}

function publicWorkshopOrder_(order) {
  const enrollment = findWorkshopEnrollment_(order.enrollmentCode);
  const invoiceIds = workshopOrderInvoiceIds_(order);
  const invoices = workshopInvoicesByIds_(invoiceIds).map(publicWorkshopInvoice_);
  return {
    orderCode:order.orderCode,
    orderType:order.orderType,
    enrollmentCode:order.enrollmentCode,
    studentName:enrollment ? enrollment.studentFullName : '',
    workshopName:enrollment ? enrollment.workshopName : '',
    invoiceIds:invoiceIds,
    invoices:invoices,
    total:Number(order.total || 0),
    status:order.status,
    createdAt:new Date(order.createdAt).toISOString(),
    paymentDeadline:new Date(order.paymentDeadline).toISOString(),
    receiptNumber:order.receiptNumber || ''
  };
}

function workshopStatusLabel_(status) {
  switch (String(status || '').toUpperCase()) {
    case 'ACTIVO': return 'Activo';
    case 'PENDIENTE_PAGO': return 'Pendiente de primer pago';
    case 'BAJA_FALTA_PAGO': return 'Baja por falta de pago';
    case 'BAJA_ADMINISTRATIVA': return 'Baja administrativa';
    default: return clean_(status) || 'Sin estado';
  }
}

function workshopOrderStatusLabel_(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PAGADO': return 'pagada';
    case 'VENCIDO': return 'vencida';
    case 'ANULADO': return 'anulada';
    default: return 'no disponible';
  }
}

function workshopById_(id) {
  return rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_CATALOG).find(row => String(row.workshopId) === String(id));
}
function findWorkshopEnrollment_(code) {
  return rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS).find(row => String(row.enrollmentCode).toUpperCase() === String(code || '').trim().toUpperCase());
}
function findWorkshopOrder_(code) {
  return rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_ORDERS).find(row => String(row.orderCode).toUpperCase() === String(code || '').trim().toUpperCase());
}
function workshopInvoicesForEnrollment_(code) {
  return rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_INVOICES)
    .filter(row => String(row.enrollmentCode).toUpperCase() === String(code || '').trim().toUpperCase())
    .sort((a,b) => Number(a.sequence || 0) - Number(b.sequence || 0));
}
function workshopInvoicesByIds_(ids) {
  const map = {};
  (ids || []).forEach(id => map[String(id)] = true);
  return rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_INVOICES).filter(row => map[String(row.invoiceId)]);
}
function workshopOrderInvoiceIds_(order) {
  try { return JSON.parse(order.invoiceIdsJson || '[]').map(String).sort(); } catch (_) { return []; }
}
function workshopSameIds_(a,b) {
  a = (a || []).map(String).sort(); b = (b || []).map(String).sort();
  return a.length === b.length && a.every((value,index) => value === b[index]);
}
function authenticatedWorkshopEnrollments_(guardianDni, surnameNormalized) {
  return rowsObjects_(RENTAL_CFG.SHEETS.WORKSHOP_ENROLLMENTS).filter(row =>
    digits_(row.guardianDni) === guardianDni && normalizeWorkshopText_(row.guardianFullName).indexOf(surnameNormalized) !== -1
  );
}
function normalizeWorkshopText_(value) {
  return clean_(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');
}
function workshopDeclarationText_(guardianFullName, guardianDni, studentFullName) {
  return 'Por intermedio de la presente, yo ' + clean_(guardianFullName) + ', identificado(a) con DNI ' + digits_(guardianDni) + ', AUTORIZO bajo mi responsabilidad a mi menor hijo(a) ' + clean_(studentFullName) + ' a participar de las escuelas y/o talleres municipales, dejando constancia de que se encuentra en perfectas condiciones físicas y psicológicas; asimismo, me comprometo a cumplir y respetar las indicaciones, reglas y disposiciones que se determinen dentro de los mismos. EXONERO DE TODA RESPONSABILIDAD A LA MUNICIPALIDAD DISTRITAL DE PACHACÁMAC.';
}
function isPachacamacDistrict_(value) { return normalizeWorkshopText_(value) === 'PACHACAMAC'; }
function parseWorkshopDate_(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),0,0,0,0) : new Date('invalid');
}
function workshopAge_(birthDate, referenceDate) {
  const birth = new Date(birthDate), ref = new Date(referenceDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const diff = ref.getMonth() - birth.getMonth();
  if (diff < 0 || (diff === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}
function workshopMonthLabel_(date) {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const d = new Date(date);
  return months[d.getMonth()] + ' ' + d.getFullYear();
}
function nextWorkshopOrderDeadline_(fromDate) {
  const next = startDay_(fromDate);
  do { next.setDate(next.getDate() + 1); } while (!isWorkshopCashierBusinessDay_(next));
  if (next.getDay() === 6) next.setHours(RENTAL_CFG.CASHIER_SATURDAY_CLOSE_HOUR,0,0,0);
  else next.setHours(RENTAL_CFG.CASHIER_CLOSE_HOUR,0,0,0);
  return next;
}
function addWorkshopBusinessDaysDeadline_(fromDate, businessDays) {
  const target = startDay_(fromDate);
  let count = 0;
  while (count < Number(businessDays || 0)) {
    target.setDate(target.getDate() + 1);
    if (isWorkshopCashierBusinessDay_(target)) count++;
  }
  if (target.getDay() === 6) target.setHours(RENTAL_CFG.CASHIER_SATURDAY_CLOSE_HOUR,0,0,0);
  else target.setHours(RENTAL_CFG.CASHIER_CLOSE_HOUR,0,0,0);
  return target;
}
function isWorkshopCashierBusinessDay_(date) {
  if (!isCashierBusinessDay_(date)) return false;
  try { return !isHoliday_(date); } catch (_) { return true; }
}
function workshopRandom_(length) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let value = '';
  for (let i=0;i<length;i++) value += alphabet.charAt(Math.floor(Math.random()*alphabet.length));
  return value;
}
function makeWorkshopEnrollmentCode_(guardianDni) { return 'TAL' + digits_(guardianDni).slice(-4) + workshopRandom_(5); }
function makeWorkshopOrderCode_(guardianDni) { return 'PAG' + digits_(guardianDni).slice(-4) + workshopRandom_(5); }
function uniqueWorkshopEnrollmentCode_(guardianDni) {
  for (let i=0;i<12;i++) { const code=makeWorkshopEnrollmentCode_(guardianDni); if (!findWorkshopEnrollment_(code)) return code; }
  throw new Error('No se pudo generar un código de matrícula único. Intenta nuevamente.');
}
function uniqueWorkshopOrderCode_(guardianDni) {
  for (let i=0;i<12;i++) { const code=makeWorkshopOrderCode_(guardianDni); if (!findWorkshopOrder_(code)) return code; }
  throw new Error('No se pudo generar un código de pago único. Intenta nuevamente.');
}
