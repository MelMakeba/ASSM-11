interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface ContactManagerInterface {
    addContact(contact: Omit<Contact, "id">): Contact;
    updateContact(contact: Contact): boolean;
    deleteContact(id: string): boolean;
    getContact(id: string): Contact | null;
    getAllContacts(): Contact[];
    searchContacts(query: string): Contact[];
}

class StorageService {
    private readonly storageKey = 'contacts';

    constructor() {
        console.log('StorageService initialized');
        try {
            if (!localStorage.getItem(this.storageKey)) {
                localStorage.setItem(this.storageKey, JSON.stringify([]));
                console.log('Created empty contacts array in localStorage');
            } else {
                console.log('Found existing contacts in localStorage');
            }
        } catch (error) {
            console.error('localStorage error in constructor:', error);
        }
    }

    getContacts(): Contact[] {
        try {
            const contacts = localStorage.getItem(this.storageKey);
            const parsedContacts = contacts ? JSON.parse(contacts) : [];
            console.log('Retrieved contacts:', parsedContacts);
            return parsedContacts;
        } catch (error) {
            console.error('Error getting contacts:', error);
            return [];
        }
    }

    saveContacts(contacts: Contact[]): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(contacts));
            console.log('Saved contacts to localStorage:', contacts);
        } catch (error) {
            console.error('Error saving contacts:', error);
        }
    }

    addContact(contact: Contact): void {
        try {
            console.log('Adding contact:', contact);
            const contacts = this.getContacts();
            contacts.push(contact);
            this.saveContacts(contacts);
            console.log('Contact added successfully');
        } catch (error) {
            console.error('Error adding contact:', error);
        }
    }

    updateContact(contact: Contact): boolean {
        try {
            const contacts = this.getContacts();
            const index = contacts.findIndex(c => c.id === contact.id);
            
            if (index !== -1) {
                contacts[index] = contact;
                this.saveContacts(contacts);
                console.log('Contact updated successfully');
                return true;
            } else {
                console.log('Contact not found for update');
                return false;
            }
        } catch (error) {
            console.error('Error updating contact:', error);
            return false;
        }
    }

    deleteContact(id: string): boolean {
        try {
            const contacts = this.getContacts();
            const filteredContacts = contacts.filter(c => c.id !== id);
            
            if (filteredContacts.length !== contacts.length) {
                this.saveContacts(filteredContacts);
                console.log('Contact deleted successfully');
                return true;
            } else {
                console.log('Contact not found for deletion');
                return false;
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            return false;
        }
    }

    getContact(id: string): Contact | null {
        try {
            const contacts = this.getContacts();
            const contact = contacts.find(c => c.id === id);
            console.log('Retrieved contact:', contact);
            return contact || null;
        } catch (error) {
            console.error('Error getting contact:', error);
            return null;
        }
    }
}

class ContactManager implements ContactManagerInterface {
    private storageService: StorageService;

    constructor() {
        this.storageService = new StorageService();
    }

    addContact(contactData: Omit<Contact, "id">): Contact {
        const newContact: Contact = {
            ...contactData,
            id: this.generateId()
        };

        this.storageService.addContact(newContact);
        return newContact;
    }

    updateContact(contact: Contact): boolean {
        return this.storageService.updateContact(contact);
    }

    deleteContact(id: string): boolean {
        return this.storageService.deleteContact(id);
    }

    getContact(id: string): Contact | null {
        return this.storageService.getContact(id);
    }

    getAllContacts(): Contact[] {
        return this.storageService.getContacts();
    }

    searchContacts(query: string): Contact[] {
        const contacts = this.getAllContacts();
        const lowerQuery = query.toLowerCase();
        
        return contacts.filter(contact => 
            contact.name.toLowerCase().includes(lowerQuery) ||
            contact.email.toLowerCase().includes(lowerQuery) ||
            contact.phone.toLowerCase().includes(lowerQuery)
        );
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}

class ContactApp {
    private contactManager: ContactManager;
    private contactForm: HTMLFormElement;
    private nameInput: HTMLInputElement;
    private emailInput: HTMLInputElement;
    private phoneInput: HTMLInputElement;
    private idInput: HTMLInputElement;
    private updateButton: HTMLButtonElement;
    private cancelButton: HTMLButtonElement;
    private contactList: HTMLElement;
    private searchInput: HTMLInputElement;
    private contactCountElement: HTMLElement;
    private noContactsElement: HTMLElement;
    private currentView: 'grid' | 'list' = 'grid';
    private currentContactToDelete: string = '';

    constructor() {
        this.contactManager = new ContactManager();
        
        this.contactForm = document.getElementById('contact-form') as HTMLFormElement;
        this.nameInput = document.getElementById('name') as HTMLInputElement;
        this.emailInput = document.getElementById('email') as HTMLInputElement;
        this.phoneInput = document.getElementById('phone') as HTMLInputElement;
        this.idInput = document.getElementById('contact-id') as HTMLInputElement;
        this.updateButton = document.getElementById('update-button') as HTMLButtonElement;
        this.cancelButton = document.getElementById('cancel-button') as HTMLButtonElement;
        this.contactList = document.getElementById('contact-list') as HTMLElement;
        this.searchInput = document.getElementById('search-input') as HTMLInputElement;
        this.contactCountElement = document.getElementById('contact-count') as HTMLElement;
        this.noContactsElement = document.getElementById('no-contacts') as HTMLElement;
        
        console.log('Contact Form:', this.contactForm);
        console.log('Contact List:', this.contactList);
        
        this.initEventListeners();
        this.renderContactList();
    }

    private initEventListeners(): void {
        this.contactForm.addEventListener('submit', this.handleAddContact.bind(this));
        
        this.updateButton.addEventListener('click', this.handleUpdateContact.bind(this));
        
        this.cancelButton.addEventListener('click', this.handleCancelEdit.bind(this));
        
        this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        
        document.getElementById('grid-view')?.addEventListener('click', () => this.setView('grid'));
        document.getElementById('list-view')?.addEventListener('click', () => this.setView('list'));
        
        document.getElementById('confirm-delete')?.addEventListener('click', () => this.confirmDelete());
        document.getElementById('cancel-delete')?.addEventListener('click', () => this.closeConfirmationModal());
        
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('confirmation-modal') as HTMLElement;
            if (event.target === modal) {
                this.closeConfirmationModal();
            }
        });
        
        console.log('Event listeners initialized');
    }

    private handleAddContact(event: Event): void {
        event.preventDefault();
        console.log('Add contact form submitted');
        
        const newContact = {
            name: this.nameInput.value,
            email: this.emailInput.value,
            phone: this.phoneInput.value
        };
        
        console.log('Adding new contact:', newContact);
        this.contactManager.addContact(newContact);
        
        this.showNotification(
            'success', 
            'Contact Added', 
            `${newContact.name} has been added to your contacts.`
        );
        
        this.resetForm();
        this.renderContactList();
    }

    private handleUpdateContact(): void {
        const updatedContact: Contact = {
            id: this.idInput.value,
            name: this.nameInput.value,
            email: this.emailInput.value,
            phone: this.phoneInput.value
        };
        
        console.log('Updating contact:', updatedContact);
        const success = this.contactManager.updateContact(updatedContact);
        
        if (success) {
            this.showNotification(
                'success', 
                'Contact Updated', 
                `${updatedContact.name}'s information has been updated.`
            );
        }
        
        this.resetForm();
        this.renderContactList();
    }

    private handleEditContact(contact: Contact): void {
        console.log('Editing contact:', contact);
        this.nameInput.value = contact.name;
        this.emailInput.value = contact.email;
        this.phoneInput.value = contact.phone;
        this.idInput.value = contact.id;
        
        this.updateButton.style.display = 'flex';
        this.cancelButton.style.display = 'flex';
        document.querySelector('.btn-add')!.setAttribute('style', 'display:none');
        
        
        this.contactForm.scrollIntoView({ behavior: 'smooth' });
    }

    private handleDeleteContact(id: string): void {
        const contact = this.contactManager.getContact(id);
        if (!contact) return;

        this.currentContactToDelete = id;
        
        const contactToDeleteElement = document.querySelector('.contact-to-delete') as HTMLElement;
        if (contactToDeleteElement) {
            contactToDeleteElement.textContent = `${contact.name} (${contact.email})`;
        }
        
        const modal = document.getElementById('confirmation-modal') as HTMLElement;
        if (modal) {
            modal.style.display = 'block';
        }
    }

    private handleCancelEdit(): void {
        console.log('Canceling edit');
        this.resetForm();
    }

    private handleSearch(): void {
        const query = this.searchInput.value.trim();
        console.log('Searching for:', query);
        
        if (query) {
            const results = this.contactManager.searchContacts(query);
            this.renderContacts(results);
        } else {
            this.renderContactList();
        }
    }

    private setView(view: 'grid' | 'list'): void {
        console.log('Changing view to:', view);
        this.currentView = view;
        
        document.getElementById('grid-view')?.classList.remove('active');
        document.getElementById('list-view')?.classList.remove('active');
        document.getElementById(`${view}-view`)?.classList.add('active');
        
        this.contactList.classList.remove('contact-grid', 'contact-list');
        this.contactList.classList.add(`contact-${view}`);
        
        this.renderContactList();
    }

    private resetForm(): void {
        this.contactForm.reset();
        this.idInput.value = '';
        
        this.updateButton.style.display = 'none';
        this.cancelButton.style.display = 'none';
        document.querySelector('.btn-add')!.removeAttribute('style');
        
        console.log('Form reset');
    }

    private renderContactList(): void {
        const contacts = this.contactManager.getAllContacts();
        console.log('Rendering contact list with', contacts.length, 'contacts');
        this.renderContacts(contacts);
    }

    private renderContacts(contacts: Contact[]): void {
        this.contactList.innerHTML = '';
        
        if (this.contactCountElement) {
            this.contactCountElement.textContent = `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`;
        }
        
        if (contacts.length === 0) {
            if (this.noContactsElement) {
                this.noContactsElement.style.display = 'block';
            }
            this.contactList.style.display = 'none';
        } else {
            if (this.noContactsElement) {
                this.noContactsElement.style.display = 'none';
            }
            this.contactList.style.display = this.currentView === 'grid' ? 'grid' : 'block';
        }
        
        contacts.forEach(contact => {
            const contactElement = this.createContactElement(contact);
            this.contactList.appendChild(contactElement);
        });
    }

    private createContactElement(contact: Contact): HTMLElement {
        const template = document.getElementById('contact-card-template') as HTMLTemplateElement;
        if (!template) {
            console.error('Contact card template not found');
            const div = document.createElement('div');
            div.textContent = `${contact.name} - ${contact.email} - ${contact.phone}`;
            return div;
        }
        
        const clone = document.importNode(template.content, true);
        
        const card = clone.querySelector('.contact-card') as HTMLElement;
        card.dataset.id = contact.id;
        
        const initials = clone.querySelector('.initials') as HTMLElement;
        if (initials) {
            initials.textContent = this.getInitials(contact.name);
        }
        
        const nameElement = clone.querySelector('.contact-name') as HTMLElement;
        if (nameElement) nameElement.textContent = contact.name;
        
        const emailElement = clone.querySelector('.contact-email span') as HTMLElement;
        if (emailElement) emailElement.textContent = contact.email;
        
        const phoneElement = clone.querySelector('.contact-phone span') as HTMLElement;
        if (phoneElement) phoneElement.textContent = contact.phone;
        
        const editButton = clone.querySelector('.btn-edit') as HTMLButtonElement;
        if (editButton) {
            editButton.addEventListener('click', () => this.handleEditContact(contact));
        }
        
        const deleteButton = clone.querySelector('.btn-delete') as HTMLButtonElement;
        if (deleteButton) {
            deleteButton.addEventListener('click', () => this.handleDeleteContact(contact.id));
        }
        
        return clone.firstElementChild as HTMLElement;
    }

    private getInitials(name: string): string {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    private confirmDelete(): void {
        if (this.currentContactToDelete) {
            const contact = this.contactManager.getContact(this.currentContactToDelete);
            const contactName = contact ? contact.name : 'Contact';
            
            const success = this.contactManager.deleteContact(this.currentContactToDelete);
            if (success) {
                this.showNotification(
                    'success', 
                    'Contact Deleted', 
                    `${contactName} has been removed from your contacts.`
                );
            }
            
            this.currentContactToDelete = '';
            this.closeConfirmationModal();
            this.renderContactList();
        }
    }

    private closeConfirmationModal(): void {
        const modal = document.getElementById('confirmation-modal') as HTMLElement;
        if (modal) {
            modal.style.display = 'none';
        }
    }

    private showNotification(type: 'success' | 'error', title: string, message: string): void {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.error('Notification container not found');
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconName = type === 'success' ? 'checkmark-circle' : 'alert-circle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <ion-icon name="${iconName}"></ion-icon>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <div class="notification-close">
                <ion-icon name="close"></ion-icon>
            </div>
        `;
        
        container.appendChild(notification);
        
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.style.animation = 'slideOutRight 0.3s forwards';
                setTimeout(() => {
                    if (notification.parentNode === container) {
                        container.removeChild(notification);
                    }
                }, 300);
            });
        }
        
        setTimeout(() => {
            if (notification.parentNode === container) {
                notification.style.animation = 'slideOutRight 0.3s forwards';
                setTimeout(() => {
                    if (notification.parentNode === container) {
                        container.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded - initializing app');
    testLocalStorage(); 
    new ContactApp();
});

//For debugging*** 
function testLocalStorage(): boolean {
    try {
        localStorage.setItem('test', 'test');
        const result = localStorage.getItem('test') === 'test';
        localStorage.removeItem('test');
        console.log('localStorage is working:', result);
        return result;
    } catch (error) {
        console.error('localStorage is not available:', error);
        return false;
    }
}