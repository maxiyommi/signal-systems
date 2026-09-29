"""Tests del hook ruta_tp: ruta de lectura y hilo conductor del TP en cada página."""
import unittest

from hooks import ruta_tp


class TestRuta(unittest.TestCase):
    def test_orden_de_lectura(self):
        self.assertEqual(
            [p["src"] for p in ruta_tp.RUTA],
            [
                "trabajo_practico/marco_conceptual.md",
                "trabajo_practico/README.md",
                "trabajo_practico/especificacion/m0_arquitectura.md",
                "trabajo_practico/especificacion/m1_generacion.md",
                "trabajo_practico/especificacion/m2_procesamiento.md",
                "trabajo_practico/especificacion/m3_producto_final.md",
            ],
        )

    def test_hilo_en_orden(self):
        self.assertEqual(
            [h["id"] for h in ruta_tp.HILO],
            ["fenomeno", "modelo", "modulos", "excitacion", "identificacion", "dato", "automatizacion"],
        )

    def test_sin_fechas(self):
        texto = repr(ruta_tp.RUTA)
        self.assertNotRegex(texto, r"\b\d{1,2}/\d{1,2}\b")

    def test_encabezado_marca_el_paso_actual_entre_los_seis(self):
        h = ruta_tp.encabezado("trabajo_practico/especificacion/m1_generacion.md")
        self.assertIn("Paso 4 de 6", h)
        self.assertEqual(h.count('<li class="ruta-tp__paso'), 6)      # los mismos 6 pasos, nunca 7 cajas
        self.assertEqual(h.count("ruta-tp__paso actual"), 1)
        self.assertIn("M1", h.split("ruta-tp__paso actual")[1].split("</li>")[0])
        self.assertNotIn("ruta-tp__hilo", h)
        self.assertIn("(../ruta.md)", h)                 # link relativo a la ruta completa

    def test_encabezado_dice_que_etapa_del_hilo_cubre(self):
        h = ruta_tp.encabezado("trabajo_practico/especificacion/m1_generacion.md")
        self.assertIn("En el hilo conductor:", h)
        self.assertIn("Excitación", h)

    def test_encabezado_incluye_material_previo(self):
        h = ruta_tp.encabezado("trabajo_practico/especificacion/m2_procesamiento.md")
        self.assertIn("Clase 8", h)
        self.assertIn("Clase 9", h)

    def test_pie_apunta_a_la_siguiente_con_link_relativo(self):
        self.assertIn("(m1_generacion.md)", ruta_tp.pie("trabajo_practico/especificacion/m0_arquitectura.md"))
        self.assertIn("(especificacion/m0_arquitectura.md)", ruta_tp.pie("trabajo_practico/README.md"))
        self.assertIn("(README.md)", ruta_tp.pie("trabajo_practico/marco_conceptual.md"))

    def test_leer_antes_interno_usa_link_relativo(self):
        self.assertIn("[Marco conceptual](marco_conceptual.md)", ruta_tp.encabezado("trabajo_practico/README.md"))

    def test_ultima_pagina_cierra(self):
        self.assertIn("Fin del recorrido", ruta_tp.pie("trabajo_practico/especificacion/m3_producto_final.md"))

    def test_paginas_fuera_del_tp_no_cambian(self):
        self.assertEqual(ruta_tp.agregar_ruta("# Hola", "cronograma.md"), "# Hola")

    def test_agregar_ruta_inserta_despues_del_titulo(self):
        md = "# Milestone 1\n\nTexto.\n"
        out = ruta_tp.agregar_ruta(md, "trabajo_practico/especificacion/m1_generacion.md")
        self.assertTrue(out.startswith("# Milestone 1\n"))
        self.assertLess(out.index("ruta-tp"), out.index("Texto."))
        self.assertTrue(out.rstrip().endswith("</div>"))


    def test_pagina_ruta_reemplaza_el_marcador_por_seis_pasos(self):
        out = ruta_tp.agregar_ruta("# Ruta\n\n<!-- ruta-completa -->\n", "trabajo_practico/ruta.md")
        self.assertNotIn("<!-- ruta-completa -->", out)
        self.assertIn("1. **[Marco conceptual](marco_conceptual.md)**", out)
        self.assertIn("6. **[M3 · Producto final](especificacion/m3_producto_final.md)**", out)
        self.assertNotIn("ruta-tp__hilo", out)            # sin la grilla de 7 etapas
        self.assertIn('class="ruta-pasos"', out)

    def test_cada_paso_de_la_ruta_nombra_su_etapa_del_hilo(self):
        out = ruta_tp.ruta_completa()
        self.assertIn("Fenómeno físico", out)
        self.assertIn("Automatización", out)
        self.assertEqual(out.count('class="ruta-etiqueta"'), sum(len(p["etapas"]) for p in ruta_tp.RUTA))


if __name__ == "__main__":
    unittest.main()
