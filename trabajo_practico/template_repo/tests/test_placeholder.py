"""Test trivial de M0: verifica que pytest corre y que la app importa."""


def test_placeholder():
    """Siempre pasa: confirma que el entorno de tests funciona."""
    assert True


def test_app_importa():
    """La aplicacion FastAPI se puede importar."""
    from app.main import app

    assert app.title == "RIR-API"
