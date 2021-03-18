import datetime

now = datetime.datetime.now()
print ("-" * 25)
print (now)

print ('-' * 25)
print ("La semana pasada fue: ", now - datetime.timedelta(weeks=1))
print ("100 dias antes fue: ", now - datetime.timedelta(days=100))
print ("Una semana desde ahora es: ",  now + datetime.timedelta(weeks=1))
print ("1000 dias desde hoy es: ", now + datetime.timedelta(days=1000))

print ("-" * 25)
birthday = datetime.datetime(2020,7,5)

print ("Para mi cumpleaños falta ", birthday - now)
print ("-" * 25)