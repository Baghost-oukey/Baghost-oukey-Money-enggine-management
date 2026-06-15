export function budgetingSistem() {
    return (
        <div>
            <div>
                <div className="">
                    <div className="px-24 mt-40">
                        <h3 className="text-4xl font-medium"><span className="text-violet-600">AI Analisis Budgeting</span> untuk membantu menentukan pengeluaran bulanan</h3>
                        <p>membantu kamu dalam melakukan menentukan pengeluaran bulanan dengan menggunakan AI</p>
                        <div>
                            <label htmlFor="">
                                <h2 className="font-medium">Input Gaji Kamu</h2>
                                <input type="number" className="border border-slate-300 rounded-3xl"/>
                            </label>
                        </div>
                        <div>
                            <label htmlFor="">
                                <h2 className="font-medium">Keterangan tambahan</h2>
                                <input type="text" className="border border-slate-300 rounded-3xl"/>
                            </label>
                        </div>
                            <button className="bg-violet-500 text-white px-15 mx-5 py-2 rounded-3xl mt-5">Hasilkan</button>
                    </div>
                    {/* <div>
                        <Image
                            src="/images/grafik-budgeting.png"
                            alt="Grafik Budgeting"
                            width={100}
                            height={100}
                        />
                    </div> */}


                    <div>

                    </div>

                </div>
            </div>
        </div>
    )
}

export default budgetingSistem;