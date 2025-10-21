import { listXeroContacts } from "../../handlers/list-xero-contacts.handler.js";
import { CreateXeroTool } from "../../helpers/create-xero-tool.js";
import { Phone } from "xero-node";
import { z } from "zod";

const ListContactsTool = CreateXeroTool(
  "list-contacts",
  "List all contacts in Xero. This includes Suppliers and Customers.",
  {
    page: z.number().optional().describe("Optional page number to retrieve for pagination. \
      If not provided, the first page will be returned. If 100 contacts are returned, \
      call this tool again with the next page number."),
  },
  async (params) => {
    const { page } = params;
    const response = await listXeroContacts(page);

    if (response.isError) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing contacts: ${response.error}`,
          },
        ],
      };
    }

    const contacts = response.result;

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${contacts?.length || 0} contacts${page ? ` (page ${page})` : ''}:`,
        },
        ...(contacts?.map((contact) => ({
          type: "text" as const,
          text: [
            `Contact: ${contact.name}`,
            `ID: ${contact.contactID}`,
            contact.firstName ? `First Name: ${contact.firstName}` : null,
            contact.lastName ? `Last Name: ${contact.lastName}` : null,
            contact.emailAddress
              ? `Email: ${contact.emailAddress}`
              : "No email",
            contact.accountsReceivableTaxType
              ? `AR Tax Type: ${contact.accountsReceivableTaxType}`
              : null,
            contact.accountsPayableTaxType
              ? `AP Tax Type: ${contact.accountsPayableTaxType}`
              : null,
            `Type: ${
              [
                contact.isCustomer ? "Customer" : null,
                contact.isSupplier ? "Supplier" : null,
              ]
                .filter(Boolean)
                .join(", ") || "Unknown"
            }`,
            contact.defaultCurrency
              ? `Default Currency: ${contact.defaultCurrency}`
              : null,
            contact.updatedDateUTC
              ? `Last Updated: ${contact.updatedDateUTC}`
              : null,
            `Status: ${contact.contactStatus || "Unknown"}`,
            contact.contactGroups?.length
              ? `Groups: ${contact.contactGroups.map((g) => g.name).join(", ")}`
              : null,
            // Add addresses section
            contact.addresses?.length
              ? `Addresses:\n${contact.addresses.map((address, index) => {
                  const addressLines = [
                    address.attentionTo ? `  Attention To: ${address.attentionTo}` : null,
                    address.addressLine1 ? `  ${address.addressLine1}` : null,
                    address.addressLine2 ? `  ${address.addressLine2}` : null,
                    address.addressLine3 ? `  ${address.addressLine3}` : null,
                    address.addressLine4 ? `  ${address.addressLine4}` : null,
                    address.city || address.region || address.postalCode
                      ? `  ${[address.city, address.region, address.postalCode].filter(Boolean).join(", ")}`
                      : null,
                    address.country ? `  ${address.country}` : null,
                  ].filter(Boolean);
                  
                  return `  Address ${index + 1}:\n${addressLines.join('\n')}`;
                }).join('\n\n')}`
              : null,
            // Add phone numbers section
            contact.phones?.length
              ? `Phone Numbers:\n${contact.phones.map((phone) => {
                  const phoneType = phone.phoneType === Phone.PhoneTypeEnum.DEFAULT ? 'Phone' :
                                  phone.phoneType === Phone.PhoneTypeEnum.DDI ? 'Direct Dial' :
                                  phone.phoneType === Phone.PhoneTypeEnum.MOBILE ? 'Mobile' :
                                  phone.phoneType === Phone.PhoneTypeEnum.FAX ? 'Fax' :
                                  phone.phoneType === Phone.PhoneTypeEnum.OFFICE ? 'Office' :
                                  phone.phoneType || 'Unknown';
                  
                  const phoneNumber = [
                    phone.phoneCountryCode ? `+${phone.phoneCountryCode}` : null,
                    phone.phoneAreaCode ? `(${phone.phoneAreaCode})` : null,
                    phone.phoneNumber
                  ].filter(Boolean).join(' ');
                  
                  return `  ${phoneType}: ${phoneNumber || 'No number'}`;
                }).join('\n')}`
              : null,
            // Add contact persons section
            contact.contactPersons?.length
              ? `People:\n${contact.contactPersons.map((person, index) => {
                  const personLines = [
                    person.firstName ? `First Name: ${person.firstName}` : null,
                    person.lastName ? `Last Name: ${person.lastName}` : null,
                    person.emailAddress ? `Email: ${person.emailAddress}` : null,
                  ].filter(Boolean);
                  
                  return `Person ${index + 1}:\n${personLines.join('\n')}`;
                }).join('\n')}`
              : null,
            contact.hasAttachments ? "Has Attachments: Yes" : null,
            contact.hasValidationErrors ? "Has Validation Errors: Yes" : null,
          ]
            .filter(Boolean)
            .join("\n"),
        })) || []),
      ],
    };
  },
);

export default ListContactsTool;
