import os
import shutil
import stat
import subprocess
import sys

def remove_readonly(func, path, _):
    """Clear the readonly bit and reattempt the removal"""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def force_delete_folder(folder_path):
    """Force delete a folder using multiple methods"""
    print(f"Intentando eliminar la carpeta: {folder_path}")
    
    if not os.path.exists(folder_path):
        print("✅ La carpeta no existe o ya fue eliminada")
        return True
    
    # Método 1: shutil.rmtree con onerror
    try:
        print("🔄 Método 1: shutil.rmtree con manejo de errores...")
        shutil.rmtree(folder_path, onerror=remove_readonly)
        print("✅ Eliminación exitosa con shutil.rmtree")
        return True
    except Exception as e:
        print(f"❌ Método 1 falló: {e}")
    
    # Método 2: Cambiar atributos y eliminar
    try:
        print("🔄 Método 2: Cambiar atributos y eliminar...")
        # Cambiar atributos de todos los archivos
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    os.chmod(file_path, stat.S_IWRITE)
                except:
                    pass
            for dir in dirs:
                dir_path = os.path.join(root, dir)
                try:
                    os.chmod(dir_path, stat.S_IWRITE)
                except:
                    pass
        
        shutil.rmtree(folder_path)
        print("✅ Eliminación exitosa cambiando atributos")
        return True
    except Exception as e:
        print(f"❌ Método 2 falló: {e}")
    
    # Método 3: Usar subprocess con rd
    try:
        print("🔄 Método 3: Usando comando rd del sistema...")
        result = subprocess.run(['rd', '/s', '/q', folder_path], 
                              shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Eliminación exitosa con rd")
            return True
        else:
            print(f"❌ rd falló: {result.stderr}")
    except Exception as e:
        print(f"❌ Método 3 falló: {e}")
    
    # Método 4: Usar takeown y icacls
    try:
        print("🔄 Método 4: Usando takeown e icacls...")
        subprocess.run(['takeown', '/f', folder_path, '/r', '/d', 'y'], 
                      shell=True, capture_output=True)
        subprocess.run(['icacls', folder_path, '/grant', 'administrators:F', '/t'], 
                      shell=True, capture_output=True)
        shutil.rmtree(folder_path)
        print("✅ Eliminación exitosa con takeown/icacls")
        return True
    except Exception as e:
        print(f"❌ Método 4 falló: {e}")
    
    return False

def main():
    folder_to_delete = "_backups"
    
    print("=" * 60)
    print("🗑️  ELIMINADOR FORZADO DE CARPETA _BACKUPS")
    print("=" * 60)
    
    success = force_delete_folder(folder_to_delete)
    
    print("\n" + "=" * 60)
    if success:
        print("✅ ÉXITO: La carpeta _backups ha sido eliminada completamente")
    else:
        print("❌ ERROR: No se pudo eliminar la carpeta _backups")
        print("💡 Sugerencia: Reinicia el sistema y vuelve a intentar")
    print("=" * 60)
    
    # Verificación final
    if os.path.exists(folder_to_delete):
        print("⚠️  ADVERTENCIA: La carpeta aún existe después del proceso")
        return 1
    else:
        print("✅ VERIFICADO: La carpeta ha sido eliminada correctamente")
        return 0

if __name__ == "__main__":
    sys.exit(main())
