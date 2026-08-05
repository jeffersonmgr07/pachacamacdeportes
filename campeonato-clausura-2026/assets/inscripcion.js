(() => {
  'use strict';
  const C=window.Clausura;
  const form=C.$('#clausuraRegistrationForm');
  if(!form) return;
  const businessCheck=C.$('#hasBusinessData');
  const categoryInputs=C.$$('[name="categories"]');
  const modal=C.$('#registrationOrderModal');
  function message(type,text){C.$('#registrationMessage').innerHTML=text?`<div class="form-alert ${type}">${C.safe(text)}</div>`:'';}
  function selectedCategories(){return categoryInputs.filter(input=>input.checked).map(input=>input.value);}
  function updateTotal(){
    const count=selectedCategories().length;
    C.$('#selectedCategoryCount').textContent=`${count} ${count===1?'categoría':'categorías'}`;
    C.$('#registrationTotal').textContent=C.money(count*Number(window.CLAUSURA_CONFIG.FEE_PER_CATEGORY||50));
  }
  function toggleBusiness(){
    const enabled=businessCheck.checked;
    C.$$('[data-business-field]').forEach(box=>box.hidden=!enabled);
    C.$('#legalName').required=enabled;C.$('#ruc').required=enabled;
    if(!enabled){C.$('#legalName').value='';C.$('#ruc').value='';}
  }
  function validate(payload){
    if(!payload.representativeRole) return 'Selecciona el rol del representante.';
    if(!payload.firstName||!payload.lastName) return 'Completa los nombres y apellidos del representante.';
    if(!payload.documentNumber) return 'Ingresa el documento del representante.';
    if(C.digits(payload.whatsapp).length<9) return 'Ingresa un número de WhatsApp válido.';
    if(!/^\S+@\S+\.\S+$/.test(payload.email)) return 'Ingresa un correo electrónico válido.';
    if(!payload.teamName) return 'Ingresa el nombre del equipo, club o escuela.';
    if(payload.hasBusinessData && C.digits(payload.ruc).length!==11) return 'El RUC debe tener 11 dígitos.';
    if(!payload.categories.length) return 'Selecciona al menos una categoría.';
    if(payload.password.length<8) return 'La contraseña debe tener al menos 8 caracteres.';
    if(payload.password!==payload.confirmPassword) return 'Las contraseñas no coinciden.';
    if(!C.$('#authorizedDeclaration').checked||!C.$('#rulesDeclaration').checked) return 'Debes aceptar las declaraciones para continuar.';
    return '';
  }
  businessCheck.addEventListener('change',toggleBusiness);
  categoryInputs.forEach(input=>input.addEventListener('change',updateTotal));
  C.$$('[data-close-order]').forEach(button=>button.addEventListener('click',()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}));
  modal.addEventListener('click',event=>{if(event.target===modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}});
  form.addEventListener('submit',async event=>{
    event.preventDefault();message('','');
    const raw=Object.fromEntries(new FormData(form).entries());
    const payload={
      representativeRole:raw.representativeRole,firstName:String(raw.firstName||'').trim(),lastName:String(raw.lastName||'').trim(),
      documentType:raw.documentType,documentNumber:String(raw.documentNumber||'').trim(),whatsapp:C.digits(raw.whatsapp),email:String(raw.email||'').trim().toLowerCase(),
      teamName:String(raw.teamName||'').trim(),hasBusinessData:businessCheck.checked,legalName:String(raw.legalName||'').trim(),ruc:C.digits(raw.ruc),
      categories:selectedCategories(),password:raw.password||'',confirmPassword:raw.confirmPassword||'',authorizedDeclaration:true,rulesDeclaration:true
    };
    const error=validate(payload);if(error){message('error',error);return;}
    const button=C.$('#registrationSubmit');C.setBusy(button,true,'Registrando y generando orden…');message('info','Estamos registrando el equipo y generando la orden de pago. No cierres esta página.');
    try{
      const response=await C.request('registerTeam',payload);
      if(!response?.ok) throw new Error(response?.message||'No se pudo registrar el equipo.');
      localStorage.setItem('cl26_last_registration',JSON.stringify({registrationId:response.order.registrationId,orderCode:response.order.orderCode,email:payload.email,documentNumber:payload.documentNumber}));
      C.$('#registrationOrderContent').innerHTML=C.orderHtml(response.order,{title:'Equipo registrado correctamente',subtitle:'La cuenta fue creada. El registro de jugadores se habilitará después de confirmar el pago.'});
      modal.classList.add('open');modal.setAttribute('aria-hidden','false');
      form.reset();toggleBusiness();updateTotal();message('ok','La inscripción fue registrada. Revisa y conserva los códigos generados.');
    }catch(error){message('error',error.message||String(error));}
    finally{C.setBusy(button,false);}
  });
  toggleBusiness();updateTotal();
})();
