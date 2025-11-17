from io import BytesIO
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa

def render_to_pdf(template_src, context_dict={}):
    """
    Función para renderizar un template HTML a un PDF.
    """
    template = get_template(template_src)
    html = template.render(context_dict)
    
    # Creamos un buffer de BytesIO para el PDF
    result = BytesIO()
    
    # Convertimos el HTML a PDF
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result, encoding='UTF-8')
    
    if not pdf.err:
        # Si no hay errores, devolvemos el HttpResponse
        return HttpResponse(result.getvalue(), content_type='application/pdf')
    
    # Si hay un error
    return HttpResponse(f'Hubo un error al generar el PDF: {pdf.err}', status=500)