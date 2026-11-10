from app.main import app

print("Successfully loaded FastAPI App!")
print("Total registered endpoints:", len(app.routes))
for route in app.routes:
    if hasattr(route, "path"):
        print(f" - {route.path}")
