from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt", "argon2"], deprecated="auto")
hash_str = "$argon2id$v=19$m=65536,t=3,p=4$Z0N4OEl0RUZtdkQ5R3pPQQ$xQJ0B1mG8XjX0nRJ+5C4Y3y6o8L4wW9uI3ZtT4cW1Yg"
try:
    print(pwd_context.verify("password123", hash_str))
except Exception as e:
    print("Error:", e)
