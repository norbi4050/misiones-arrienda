
// Cliente de prueba manual para Prisma
class PrismaTestClient {
    constructor() {
        this.connected = false;
    }

    async connect() {
        console.log('🔗 Conectando a base de datos SQLite...');
        this.connected = true;
        return true;
    }

    async disconnect() {
        console.log('🔌 Desconectando de base de datos...');
        this.connected = false;
    }

    get user() {
        return {
            create: async (data) => {
                console.log('👤 Creando usuario:', data);
                return { id: 'test-user-id', ...data };
            },
            findMany: async () => {
                console.log('👥 Obteniendo usuarios...');
                return [
                    { id: '1', email: 'test@example.com', name: 'Usuario Test' }
                ];
            }
        };
    }

    get property() {
        return {
            create: async (data) => {
                console.log('🏠 Creando propiedad:', data);
                return { id: 'test-property-id', ...data };
            },
            findMany: async () => {
                console.log('🏘️  Obteniendo propiedades...');
                return [
                    { 
                        id: '1', 
                        title: 'Casa Test', 
                        price: 100000,
                        city: 'Posadas',
                        province: 'Misiones'
                    }
                ];
            }
        };
    }
}

module.exports = { PrismaClient: PrismaTestClient };
