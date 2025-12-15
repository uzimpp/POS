export default function MenuDetailPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Menu Item Details</h1>
            <p className="text-slate-500">Details for item ID: {params.id}</p>
        </div>
    );
}
