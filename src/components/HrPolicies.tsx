import React, { useState } from "react";

interface Policy {
    id: string;
    title: string;
    details: string;
}

const HRPolicyScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
    const [searchText, setSearchText] = useState("");

    const policies = [
        { 
            id: "1", 
            title: "Leave Policy", 
            details: "Our comprehensive leave policy ensures work-life balance for all employees:\n\n• Annual Leave: 20 days per year\n• Sick Leave: Available with medical certificate\n• Maternity/Paternity Leave: As per statutory requirements\n• Bereavement Leave: 3 days for immediate family"
        },
        { 
            id: "2", 
            title: "Work from Home Policy", 
            details: "Flexible working arrangements to support employee productivity:\n\n• 2 days per week WFH allowance\n• Prior manager approval required\n• Core working hours must be maintained\n• Regular communication expected"
        },
        { 
            id: "3", 
            title: "Overtime Policy", 
            details: "Fair compensation for additional work hours:\n\n• 1.5x hourly rate for overtime\n• Department head approval required\n• Minimum 1 hour calculation\n• Maximum 40 hours per month"
        },
        { 
            id: "4", 
            title: "Code of Conduct", 
            details: "Guidelines for professional behavior:\n\n• Respect diversity and inclusion\n• Maintain professional relationships\n• Follow ethical business practices\n• Protect company reputation"
        },
        { 
            id: "5", 
            title: "Health & Safety Policy", 
            details: "Ensuring a safe workplace environment:\n\n• Regular fire safety drills\n• Emergency procedures training\n• First aid facilities available\n• Incident reporting protocol"
        },
        { 
            id: "6", 
            title: "Anti-Harassment Policy", 
            details: "Zero tolerance approach to workplace harassment:\n\n• All forms of harassment prohibited\n• Confidential reporting process\n• Immediate investigation of complaints\n• Strict disciplinary actions for violations"
        },
        { 
            id: "7", 
            title: "IT & Data Security Policy", 
            details: "Protecting company information assets:\n\n• Secure data handling procedures\n• Confidentiality agreements\n• Regular security training\n• Prohibited data sharing practices"
        },
        { 
            id: "8", 
            title: "Expense Reimbursement Policy", 
            details: "Guidelines for claiming business expenses:\n\n• Original receipts required\n• Manager approval needed\n• Monthly submission deadline\n• Eligible expense categories"
        },
        { 
            id: "9", 
            title: "Performance Review Policy", 
            details: "Regular performance evaluation process:\n\n• Bi-annual reviews\n• Objective goal setting\n• 360-degree feedback\n• Development planning"
        },
        { 
            id: "10", 
            title: "Dress Code Policy", 
            details: "Professional appearance standards:\n\n• Smart casual daily wear\n• Formal attire for meetings\n• Clean and neat presentation\n• Industry-appropriate clothing"
        },
    ];

    const openPolicy = (policy: Policy) => {
        setSelectedPolicy(policy);
        setModalVisible(true);
    };

    const filteredPolicies = policies.filter((policy) =>
        policy.title.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="flex-1 p-4 bg-gray-100">
            <h2 className="text-2xl font-bold text-center mb-4">HR Policies</h2>

            {/* Search Bar */}
            <input
                type="text"
                className="h-12 bg-white rounded-md px-4 mb-4 shadow-md w-full"
                placeholder="Search Policy..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />

            {/* List of Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPolicies.map((item) => (
                    <button
                        key={item.id}
                        className="bg-white p-6 w-full rounded-lg shadow-md hover:shadow-lg transition-shadow text-left border border-gray-200"
                        onClick={() => openPolicy(item)}
                    >
                        <span className="text-gray-800 text-lg font-semibold block mb-2">{item.title}</span>
                        <span className="text-gray-500 text-sm">Click to view details</span>
                    </button>
                ))}
            </div>

            {/* Policy Detail Modal */}
            {modalVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="w-11/12 max-w-3xl bg-white p-8 rounded-lg shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">{selectedPolicy?.title}</h3>
                            <button
                                onClick={() => setModalVisible(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto mb-6 pr-4">
                            <div className="prose prose-blue max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 text-base leading-relaxed">
                                    {selectedPolicy?.details}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRPolicyScreen;
